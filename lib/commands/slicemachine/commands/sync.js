import consola from 'consola';
import ora from 'ora';
import inquirer from 'inquirer';

import Communication from '../../../services/communication';
import { Files, Folders, Objects } from '../utils';
import CustomTypes from '../customtypes';
import Paths from './paths';
import Endpoints from '../misc/endpoints';
import Sentry from '../../../services/sentry';

import { getOrFail as getSmFile } from '../methods/sm';
import Libraries from '../common/libraries';


// writes the custom types in the filesystem
async function writeCustomTypes(customTypes) {
  const metadata = CustomTypes.buildMetadata(customTypes);
  Folders.mkdir(Paths.CustomTypes.rootFolder);
  // write custom types metadata
  Files.writeJson(Paths.CustomTypes.index, metadata);
  // write custom types definitions
  customTypes.forEach(({ mask_id: maskId, mask_value: maskValue }) => {
    Files.writeJson(Paths.CustomTypes.customType(maskId), maskValue);
  });
}

export default async function () {
  try {
    const rootPrismicEndpoint = Endpoints.Prismic.fromCtxOrConfig();
    if (!rootPrismicEndpoint) {
      throw new Error('Unable to retrieve your Prismic endpoint.\nPlease re-run this command with: --endpoint <your-prismic-api-endpoint> or --domain <your-prismic-domain>');
    }
    const customTypes = await Communication.getAsJson(Endpoints.Prismic.customTypes(rootPrismicEndpoint), { withSlices: true });
    await writeCustomTypes(customTypes);

    const slicezoneByCustomTypes /* [CustomTypeId]: { [SliceId]: SliceModel } */ = customTypes.reduce((acc, ct) => {
      const slicesBySlicezone = Object.entries(ct.slices).reduce((slicesAcc, [szKey, slices]) => ({ ...slicesAcc, [szKey]: slices }), {});
      return { ...acc, [ct.mask_id]: slicesBySlicezone };
    }, {});

    const sm = getSmFile();

    const modelsByLib = await Promise.all(sm.libraries.map(libPath => Libraries.slicesModels(libPath)));

    // If there are name collision, the first libraries in sm.json are ordered by priority
    // Doing the following will merge all slices together by name with the right priority
    const mergedModelsWithMeta /* { [sliceName]: { id, lib, path, model, isLocal } */ = modelsByLib.reverse().reduce((acc, slices) => ({ ...acc, ...slices }), {});
    const modelsById = Object.entries(mergedModelsWithMeta).reduce((acc, [, modelWithMeta]) => ({ ...acc, [modelWithMeta.id]: modelWithMeta.model }), {});

    Object.entries(slicezoneByCustomTypes).forEach(([customTypeId, slicezones]) => {
      Object.entries(slicezones).forEach(async ([slicezoneId, slices]) => {
        const [miss, diff, equals] = Objects.matchIn(slices, modelsById);
        // const spinner = ora(`Pulling slices for custom type [${customTypeId}] - slicezone [${slicezoneId}]\n`).start();

        const equalsWithMeta = Object.entries(equals).reduce((acc, [sliceId]) => ({ ...acc, ...Objects.find(sliceId, mergedModelsWithMeta)((searchKey, [, targetValue]) => searchKey === targetValue.id) }), {});
        Displays.equalSlices(equalsWithMeta);

        const missingWithMeta = miss && Object.entries(miss).reduce((acc, [sliceId]) => ({ ...acc, ...Objects.find(sliceId, mergedModelsWithMeta)((searchKey, [, targetValue]) => searchKey === targetValue.id) }), {});
        await Displays.createMissingSlices(missingWithMeta);

        const conflictedWithMeta = Object.entries(diff).reduce((acc, [sliceId]) => {
          const oldModelWithMeta = Objects.find(sliceId, mergedModelsWithMeta)((searchKey, [, targetValue]) => searchKey === targetValue.id);

          const newModel = diff[sliceId] && diff[sliceId].after;
          if (!newModel) throw new Exception('Oops! Something went wrong while resolving conflicts.');

          const newModelWithMeta = Object.entries(oldModelWithMeta).reduce((acc, [sliceName, value]) => ({ ...acc, [sliceName]: { ...value, model: newModel } }), {});
          console.log(newModelWithMeta);
          return { ...acc, ...newModelWithMeta };
        }, {});
        Displays.handleConflictedSlices(conflictedWithMeta);

        // spinner.succeed();


        // these slices are up to date => equals
        // these slices are missing in your project, select which one you want to pull
        // these slices are conflicting => diff
      });
    });

    // function matchObjIn(toMatchObj, dataset): [miss, diff, equals]
  } catch (e) {
    Sentry.report(e);
    consola.error(e);
    return null;
  }
}

const Displays = {
  equalSlices(equals) {
    const sliceList = Object.keys(equals).map(k => `\t- ${k}`).join('\n');
    consola.success(`These slices are already in your project: \n${sliceList}`);
  },

  async createMissingSlices(missing) {
    if (!missing) return;
    const { selectedSlices } = await Prompts.createMissingSlices(missing);
    console.log(selectedSlices);
  },

  async handleConflictedSlices(conflicted) {
    const [localConflicts, libConflicts] = Objects.partition(conflicted, ([, value]) => value.isLocal);
    const sliceList = Object.keys(libConflicts).map(k => `\t- ${k}`).join('\n');
    consola.error(`These slices conflicts with components coming from your node modules: \n${sliceList}`);

    const toOverwriteKeys = await (async () => {
      if (Objects.nonEmpty(localConflicts)) {
        const { selectedSlices } = await Prompts.overwriteConflictedSlices(localConflicts);
        return selectedSlices;
      }
      return [];
    })();

    toOverwriteKeys.forEach((key) => {
      const modelWithMeta = Objects.find(key, localConflicts)()[key];
      if (modelWithMeta) {
        try {
          console.log(modelWithMeta);
          console.log(modelWithMeta.path);
          console.log(modelWithMeta.model);
          Files.writeJson(modelWithMeta.path, modelWithMeta.model);
        } catch (e) {
          console.log(e);
          consola.error(`Failed to write the slice ${key} in ${modelWithMeta.path}`);
        }
      } else consola.error(`Unable to update the model of ${key}`);
    });
  },
};

const Prompts = {
  async createMissingSlices(missing) {
    return inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedSlices',
      prefix: '🗂 ',
      message: 'Select the slices you wish to create in your project',
      choices: Object.keys(missing).map(key => ({
        name: key,
        value: key,
        checked: true,
      })),
    }]);
  },

  async overwriteConflictedSlices(localConflicted) {
    return inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedSlices',
      prefix: '🗂 ',
      message: 'Select the slices you wish to overwrite in your project',
      choices: Object.keys(localConflicted).map(key => ({
        name: key,
        value: key,
        checked: true,
      })),
    }]);
  },
};


// function createSlice(pathToSlices, sliceName) {
//   try {
//     await copy(
//       path.join(__dirname, 'templates', framework),
//       path.join(pathToSlices, sliceName),
//       {
//         componentName: sliceName,
//         colorCode: '#FFFF63',
//         field: 'false',
//       },
//     );
//   } catch (e) {
//     return consola.error(e.message);
//   }
