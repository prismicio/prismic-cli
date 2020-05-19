import fs from 'fs';
import path from 'path';
import isValidPath from 'is-valid-path';
import inquirer from 'inquirer';
import consola from 'consola';
import { promisify } from 'util';
import cpy from 'copy-template-dir';
import { hyphenate, pascalize } from 'sm-commons/utils/str';

import Mustache from 'mustache';

import Communication from '../../../../services/communication';
import Sentry from '../../../../services/sentry';
import Authentication from '../../../authentication';
import { ctx } from '../../../../context';
import Helpers from '../../../../helpers';
import getFramework from '../../methods/getFramework';
import globals from '../../../../globals';
import getLibraryInfoFromPath from '../../methods/libraryInfo';

import {
  patch as patchSmFile,
  get as getSmFile,
} from '../../methods/sm';

const copy = promisify(cpy);

// should move to sm-commons
function snakecalize(str) {
  return hyphenate(str).replace(/-/g, '_');
}

function findRichTextField(model) {
  const { 'non-repeat': fields = {} } = model;
  const maybeEntry = Object.entries(fields).find(([_, e]) => e.type === 'StructuredText');
  return maybeEntry ? `slice.primary.${maybeEntry[0]}` : 'false';
}

function validateSlicezones(customType, selectedSlicezones, availableSlicezones, sliceName) {
  const errors = selectedSlicezones
    .map((selectedZone) => {
      if (availableSlicezones[selectedZone].includes(sliceName)) {
        return `- The slicezone '${selectedZone}' already contains a slice named ${sliceName}`;
      }
      return null;
    })
    .filter(a => !!a);
  if (errors.length) return `[Conflicts] ${customType}: \n ${errors.join('\n')}`;
  return null;
}

function validateCustomTypes(selectedCustomTypes, availableCustomTypes, sliceName) {
  const errors = selectedCustomTypes
    .map((selectedCT) => {
      const slicezones = availableCustomTypes[selectedCT];
      const szoneIds = Object.keys(slicezones);
      // we only make this validation if there is only one slicezone otherwise we wait for the user to select the slicezones he wants to put his slice in.
      if (szoneIds.length === 1) return validateSlicezones(selectedCT, szoneIds, slicezones, sliceName);
      return null;
    })
    .filter(a => !!a);

  if (errors.length) return errors.join('\n');
  return null;
}

const Prompts = {
  componentName(pathToCreate) {
    return inquirer.prompt([{
      type: 'text',
      name: 'sliceName',
      message: 'Enter the name of your slice (2 words, PascalCased)',
      initial: 'eg. LargeHeader',
      prefix: '🍕',
      validate: (value) => {
        if (fs.existsSync(path.join(pathToCreate, value))) {
          return 'Slice exists already, pick another name';
        }
        const kebabCased = hyphenate(value);
        if (kebabCased.indexOf('-') < 1) {
          return 'Value has to be 2-worded when transformed into kebab-case.\neg. \'LargeHeader\' would become \'large-header\'';
        }
        return true;
      },
    }]);
  },
  slicesPath() {
    return inquirer.prompt([{
      type: 'input',
      name: 'answer',
      default: 'slices',
      prefix: '🗂 ',
      message: 'Where should we create the slice (starting from root):',
      validate(input) {
        const isValid = isValidPath(path.join(process.cwd(), input));
        return isValid || 'Path is invalid';
      },
    }]);
  },

  pathToLib(paths) {
    return inquirer.prompt([{
      type: 'list',
      name: 'answer',
      prefix: '🗂 ',
      message: 'Where should we create this slice?',
      choices: paths.map(p => ({
        name: p,
        value: p,
      })),
    }]);
  },

  customTypes(customTypeList, sliceName) {
    const customTypesIds = Object.keys(customTypeList);
    return inquirer.prompt([{
      type: 'checkbox',
      message: 'Select custom types',
      name: 'customtypes',
      choices: customTypesIds.map(ctId => ({ name: ctId })),
      validate(answers) {
        if (answers.length < 1) return 'You must choose at least one custom type.';

        const errors = validateCustomTypes(answers, customTypeList, sliceName);
        if (errors) return errors;

        return true;
      },
    }]);
  },

  slicezones(customTypeId, slicezoneList, sliceName) {
    return inquirer.prompt([{
      type: 'checkbox',
      message: `Select slicezones for ${customTypeId}`,
      name: customTypeId,
      choices: Object.keys(slicezoneList).map(sz => ({ name: sz })),
      validate(answers) {
        if (answers.length < 1) return 'You must choose at least one slice zone.';

        const errors = validateSlicezones(customTypeId, answers, slicezoneList, sliceName);
        if (errors) return errors;

        return true;
      },
    }]);
  },
};

function formatLibPath(libPath) {
  if (libPath.indexOf('@/') === 0) {
    return libPath;
  }
  if (libPath.indexOf('/') === 0) {
    return `@${libPath}`;
  }
  return `@/${libPath}`;
}

function _readPrismicEndpoint() {
  if (!(ctx.endpoint || ctx.domain)) {
    try {
      const file = fs.readFileSync(path.join(process.cwd(), './sm.json'), 'utf8');
      const jsConfig = JSON.parse(file);
      return jsConfig.apiEndpoint;
    } catch (e) {
      Sentry.report(e);
      return null;
    }
  }
  return ctx.endpoint || ctx.domain;
}

async function createRemoteSlice(framework, prismicEndpoint, sliceName) {
  try {
    await Authentication.connect();

    const customTypes = await Communication.getAsJson(Helpers.Endpoints.customTypesApi(prismicEndpoint), { withSlices: true });

    const slicezoneByCustomTypes = customTypes.reduce((acc, ct) => {
      const slicesBySlicezone = Object.entries(ct.slices).reduce((slicesAcc, [szKey, slices]) => ({ ...slicesAcc, [szKey]: Object.keys(slices).map(pascalize) }), {});
      return { ...acc, [ct.mask_id]: slicesBySlicezone };
    }, {});
    const { customtypes: selectedCustomTypes } = await Prompts.customTypes(slicezoneByCustomTypes, sliceName);
    const insertOptions = await (async () => {
      let acc = {};
      for (let i = 0; i < selectedCustomTypes.length; i += 1) {
        const ctId = selectedCustomTypes[i];
        const slicezones = slicezoneByCustomTypes[ctId];
        const szonesIds = Object.keys(slicezones);
        if (szonesIds.length <= 1) acc = { ...acc, [ctId]: szonesIds };
        else {
          /* eslint-disable no-await-in-loop */
          const answers = await Prompts.slicezones(ctId, slicezones, sliceName);
          acc = { ...acc, [ctId]: answers[ctId] };
        }
      }
      return acc;
    })();


    const sliceModel = (() => {
      const defaultModelFile = fs.readFileSync(path.join(__dirname, 'templates', framework, 'model.json'), 'utf8');
      return JSON.parse(Mustache.render(defaultModelFile, { componentName: sliceName }));
    })();

    const sliceId = snakecalize(sliceName);

    const opts = {
      id: sliceId,
      model: sliceModel,
      customtypes: insertOptions,
    };
    await Communication.postJson(`${Helpers.Endpoints.slicesApi(prismicEndpoint)}/create`, opts);
    return { model: sliceModel };
  } catch (e) {
    Sentry.report(e);
    consola.info(`Could not create slice ${sliceName} in Prismic.`);
    throw new Error(`${e}`);
  }
  // - make the request to prismic and if it fails, display the errors and how to resolve it otherwise run the copy below =>
}

/* eslint-disable  consistent-return */
export default async function () {
  const framework = await getFramework(ctx.SliceMachine);
  if (!framework || framework instanceof Error === true) {
    return consola.info('Exiting...');
  }
  const sm = getSmFile();
  if (!sm) {
    return consola.error('sm file not found.\nExiting...');
  }
  if (!sm.libraries) {
    return consola.error('sm file should have a "libraries" field, filled with paths to SM libs');
  }
  if (!sm.libraries.length || !Array.isArray(sm.libraries)) {
    return consola.error('empty or malformed "libraries" field');
  }

  const localibs = sm.libraries.reduce((acc, libPath) => {
    const { isLocal } = getLibraryInfoFromPath(libPath);
    if (isLocal) {
      return [...acc, libPath];
    }
    return acc;
  }, []);

  let libPath = localibs && localibs[0];
  if (!localibs.length) {
    consola.info('No local folder configured with SliceMachine');
    const { answer } = await Prompts.slicesPath(localibs);
    libPath = formatLibPath(answer.trim());
    patchSmFile({ libraries: [libPath] }, true);
  } else if (localibs.length > 1) {
    const { answer } = await Prompts.pathToLib(localibs);
    libPath = answer;
  }

  const { pathToSlices } = getLibraryInfoFromPath(libPath);
  const { sliceName } = await Prompts.componentName(pathToSlices);

  const prismicEndpoint = _readPrismicEndpoint();
  if (!prismicEndpoint) {
    throw new Error('Unable to retrieve your Prismic endpoint.\nPlease re-run this command with: --endpoint <your-prismic-api-endpoint> or --domain <your-prismic-domain>');
  }

  try {
    const { model } = await createRemoteSlice(framework, prismicEndpoint, sliceName);

    const field = findRichTextField(model);
    await copy(
      path.join(__dirname, 'templates', framework),
      path.join(pathToSlices, sliceName),
      {
        componentName: sliceName,
        colorCode: '#FFFF63',
        field,
      },
    );
  } catch (e) {
    return consola.error(e.message);
  }

  console.log(`\n✅ ${framework} slice created at ${libPath}!`);

  console.log(`Use it right away 👉 ${Helpers.Endpoints.wroomDocumentsList(prismicEndpoint)}`);
}
