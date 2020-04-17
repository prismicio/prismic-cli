import consola from 'consola';
import { Files, Folders, matchObjIn } from '../utils';
import SliceMachine from '../slicemachine';
import CustomTypes from '../customtypes';
import Paths from './paths';
import createEndpoints from '../misc/createEndpoints';
import Sentry from '../../../services/sentry';
import { determineFrameworkUsed } from '../common/frameworks';


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
    const Endpoints = createEndpoints();
    const [frameworkError, framework] = await determineFrameworkUsed();
    if (!framework || frameworkError) {
      return consola.info('Exiting...');
    }
    const config = require(Paths.SmConfig); // eslint-disable-line

    if (!config.apiEndpoint) {
      consola.error(`File "${Paths.SmConfig}" is invalid. Property "apiEndpoint" is required.`);
      return consola.info(('Exiting...'));
    }

    if (!config.libraries) {
      consola.error(`File "${Paths.SmConfig}" is invalid. Property "libraries" is required.`);
      return consola.info(('Exiting...'));
    }

    const list = config.libraries.filter(e => e.indexOf('~') !== 0).join(',');
    const baseParams = {
      framework,
      list,
    };

    const customTypes = await (() => {
      const endpoint = Endpoints.CustomTypesApi.customTypes(config.apiEndpoint);
      return CustomTypes.fetch(endpoint);
    })();
    await writeCustomTypes(customTypes);

    const missingSlices = await (async () => {
      const endpoint = Endpoints.SliceMachine.librairies();

      const slicemachineSlices = (await SliceMachine.fetchAllSlicesModels(endpoint, baseParams))
        .reduce((acc, library) => ({
          ...acc,
          ...library.slices,
        }), {});

      const customTypesSlices = CustomTypes.extractSlices(customTypes);

      // We should also check which models exist in user's filesystem
      const [missing] = matchObjIn(slicemachineSlices, customTypesSlices);
      return missing;
    })();

    if (missingSlices) {
      consola.info('We found some slices in Prismic that don\'t exist in your project.');
      consola.log('What should we do?');
    } else {
      consola.success('[Slice Machine] You\'re now in sync with your writing room !');
    }
    return null;
  } catch (e) {
    Sentry.report(e);
    console.error(e);
    return null;
  }
}
