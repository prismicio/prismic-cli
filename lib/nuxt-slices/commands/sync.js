import AdmZip from 'adm-zip';
import Endpoints from '../misc/endpoints';
import { pascalize, Files, Folders, ZipUtils, matchObjIn } from '../utils';

import FileSystem, { FileType } from '../filesystem';
import SliceMachine from '../slicemachine';
import CustomTypes from '../customtypes';
import Helpers from '../../helpers';
import Paths, { SLICES_EXPORTS_FILENAME, SLICES_FOLDER_NAME } from './paths';

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

function componentNamesToPath(maybePrefix, sliceNamesWithType) {
  return sliceNamesWithType.map(({ name, type }) => {
    const prefix = maybePrefix ? `${maybePrefix}/` : '';
    return prefix + name + (type === FileType.Folder ? '/' : '');
  });
}

export default async (/* config */c, args) => {
  try {
    const isDevMode = args['--dev'];
    const { cookies } = args;
    const config = require(Paths.PrismicConfig); // eslint-disable-line

    const customTypes = await (() => {
      const endpoint = Endpoints.CustomTypesApi.customTypes(config.default ? config.default.apiEndpoint : config.apiEndpoint);
      return CustomTypes.fetch(endpoint, cookies);
    })();
    await writeCustomTypes(customTypes);

    /**
     *  fetch the slices models from slice machine
     * collect their model
     * compare with the ones on the filesystem
     * returns [slices implementation to fetch from slicemachine | missing slices implementation]
     * */
    const [missingSlices, toFetchFromSlicemachine] = await (async () => {
      const endpoint = Endpoints.SliceMachine.models(isDevMode, 'nuxt');

      // format slices to the regular format { [key]: model } for comparaison
      const slicemachineSlices = (await SliceMachine.fetchAllSlicesModels(endpoint, cookies))
        .reduce((acc, { key, model }) => (
          { ...acc, [key]: model }
        ), {});
      const customTypesSlices = CustomTypes.extractSlices(customTypes);
      const filesystemSlices = FileSystem.extractSlicesModels(Paths.SliceMachine.Slices.rootFolder);

      const [missingInFilesystem] = matchObjIn(customTypesSlices, filesystemSlices);
      const [missingInSliceMachine, /* diff */, foundInSliceMachine] = matchObjIn(missingInFilesystem, slicemachineSlices);
      return [missingInSliceMachine, foundInSliceMachine];
    })();

    if (toFetchFromSlicemachine) {
      const slicesZipPath = await (() => {
        const slices = Object.keys(toFetchFromSlicemachine).map(pascalize).join(',');
        const queryParams = { slices };
        return SliceMachine.downloadSlices(Endpoints.SliceMachine.slices(isDevMode, 'nuxt'), queryParams);
      })();

      if (slicesZipPath && slicesZipPath instanceof Error === false) {
        const zip = new AdmZip(slicesZipPath);
        const slicesNames = Object.keys(toFetchFromSlicemachine).map(pascalize);
        Helpers.UI.display([
          'Importing new slices from Slice Machine...',
          ...slicesNames.map(n => `- ${n}`),
        ]);

        const sliceNamesWithType = slicesNames.map(name => ({ name, type: FileType.Folder }));

        if (Files.exists(Paths.SliceMachine.Slices.rootFolder)) {
          const componentsPath = componentNamesToPath(SLICES_FOLDER_NAME, sliceNamesWithType);
          const filteredEntries = ZipUtils.filterZipEntries(componentsPath, zip);
          ZipUtils.mergeInto(filteredEntries, Paths.SliceMachine.rootFolder, zip);

          // handle exports
          slicesNames.forEach((sliceName) => {
            const data = `export { default as ${sliceName} } from './${sliceName}';\n`;
            Files.append(Paths.SliceMachine.Slices.exports, data);
          });
        } else {
          const allRequiredFilenames = sliceNamesWithType.concat([{ name: SLICES_EXPORTS_FILENAME, type: FileType.File }]);
          const componentsPath = componentNamesToPath(SLICES_FOLDER_NAME, allRequiredFilenames);
          const filteredEntries = ZipUtils.filterZipEntries(componentsPath, zip);
          ZipUtils.extractTo(filteredEntries, Paths.SliceMachine.rootFolder, zip);
        }
      }
    }

    if (missingSlices) {
      Helpers.UI.display([
        'All these slices have no implementation yet and cannot be found in Slice Machine:',
        ...Object.keys(missingSlices),
      ]);
    }

    Helpers.UI.display('[Slice Machine] You\'re now in sync with your writing room !');
  } catch (e) {
    console.error(e);
  }
};
