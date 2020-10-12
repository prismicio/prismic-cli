import path from 'path';
import cpy from 'copy-template-dir';
import fs from 'fs';
import consola from 'consola';
import inquirer from 'inquirer';
import { pascalize, snakelize } from 'sm-commons/utils/str';
import Mustache from 'mustache';
import { promisify } from 'util';

import { Files } from '../utils';
import Communication from '../../../services/communication';
import Sentry from '../../../services/sentry';
import Authentication from '../../authentication';
import Endpoints from '../misc/endpoints';

const copy = promisify(cpy);

const writeExport = (libPath, sliceName) => {
  const indexPath = path.join(libPath, 'index.js')
  const file = Files.exists(indexPath) ? Files.read(indexPath) : ''
  Files.write(indexPath, `${file}${file.length ? '\n' : ''}export { default as ${sliceName} } from './${sliceName}'`)
}

const Validators = {
  slicezones(customType, selectedSlicezones, availableSlicezones, sliceName) {
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
  },

  customTypes(selectedCustomTypes, availableCustomTypes, sliceName) {
    const errors = selectedCustomTypes
      .map((selectedCT) => {
        const slicezones = availableCustomTypes[selectedCT];
        const szoneIds = Object.keys(slicezones);
        // we only make this validation if there is only one slicezone otherwise we wait for the user to select the slicezones he wants to put his slice in.
        if (szoneIds.length === 1) return Validators.slicezones(selectedCT, szoneIds, slicezones, sliceName);
        return null;
      })
      .filter(a => !!a);

    if (errors.length) return errors.join('\n');
    return null;
  },
};

const Prompts = {
  customTypes(customTypeList, sliceName) {
    const customTypesIds = Object.keys(customTypeList);
    return inquirer.prompt([{
      type: 'checkbox',
      message: 'Select custom types',
      name: 'customtypes',
      choices: customTypesIds.map(ctId => ({ name: ctId })),
      validate(answers) {
        if (answers.length < 1) return 'You must choose at least one custom type.';

        const errors = Validators.customTypes(answers, customTypeList, sliceName);
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

        const errors = Validators.slicezones(customTypeId, answers, slicezoneList, sliceName);
        if (errors) return errors;

        return true;
      },
    }]);
  },
};

async function createLocal(sliceName, modelWithPath, pathToSlices, pathToTemplate) {
  await copy(
    pathToTemplate,
    path.join(pathToSlices, sliceName),
    {
      componentName: sliceName,
      componentId: snakelize(sliceName),
    },
  );

  if (modelWithPath) {
    Files.writeJson(modelWithPath.path, modelWithPath.model);
  }
  writeExport(pathToSlices, sliceName)
}

async function createRemote(prismicEndpoint, sliceName, templatePath) {
  try {
    await Authentication.connect();

    const customTypes = await Communication.getAsJson(Endpoints.Prismic.customTypes(prismicEndpoint), { withSlices: true });

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
      const defaultModelFile = fs.readFileSync(path.join(templatePath, 'model.json'), 'utf8');
      return JSON.parse(Mustache.render(defaultModelFile, { componentName: sliceName }));
    })();

    const sliceId = snakelize(sliceName);

    const opts = {
      id: sliceId,
      model: sliceModel,
      customtypes: insertOptions,
    };
    await Communication.postJson(`${Endpoints.Prismic.slices(prismicEndpoint)}/create`, opts);
    return { model: sliceModel };
  } catch (e) {
    Sentry.report(e);
    consola.info(`Could not create slice ${sliceName} in Prismic.`);
    throw new Error(`${e}`);
  }
  // - make the request to prismic and if it fails, display the errors and how to resolve it otherwise run the copy below =>
}

export default {
  createLocal,
  createRemote,
};
