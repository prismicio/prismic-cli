import consola from 'consola';

import Communication from '../../../services/communication';
import { Files, Folders } from '../utils';
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

    // await writeCustomTypes(customTypes);

    const sm = getSmFile();

    const modelsByLib = await Promise.all(sm.libraries.map(libPath => Libraries.slicesModels(libPath)));

    // If there are name collision, the first libraries in sm.json are ordered by priority
    // Doing the following will merge all slices together by name with the right priority
    const mergedSlices = modelsByLib.reverse().reduce((acc, slices) => ({ ...acc, ...slices }), {});

    console.log(mergedSlices);
  } catch (e) {
    Sentry.report(e);
    consola.error(e);
    return null;
  }
}
