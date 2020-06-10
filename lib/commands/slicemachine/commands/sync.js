import consola from 'consola';

import Communication from '../../../services/communication';
import { Files, Folders, matchObjIn } from '../utils';
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
      Object.entries(slicezones).forEach(([slicezoneId, slices]) => {
        console.log(slices);
        console.log(modelsById);
        const [miss, diff, equals] = matchObjIn(slices, modelsById);
        console.log('diff');
        console.log(JSON.stringify(diff));
      });
    });

    // function matchObjIn(toMatchObj, dataset): [miss, diff, equals]
  } catch (e) {
    Sentry.report(e);
    consola.error(e);
    return null;
  }
}


{"type":"Slice","fieldset":"Cards Carousel","description":"A carousel with text + image cards","icon":"image","display":"list","non-repeat":{"eyebrow_headline":{"type":"StructuredText","config":{"multi":"paragraph, preformatted, heading1, heading2, heading3, heading4, heading5, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true,"label":"Eyebrow headline"}},"title":{"type":"StructuredText","config":{"single":"heading1, heading2, heading3, heading4, heading5, heading6","label":"Title"}},"description":{"type":"StructuredText","config":{"multi":"paragraph, preformatted, heading1, heading2, heading3, heading4, heading5, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true,"label":"Description"}}},"repeat":{"image":{"type":"Image","config":{"constraint":{"width":null,"height":null},"thumbnails":[],"label":"Image"}},"title":{"type":"StructuredText","config":{"single":"heading3","label":"Title"}},"content":{"type":"StructuredText","config":{"multi":"paragraph, preformatted, heading1, heading2, heading3, heading4, heading5, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true,"label":"Content"}},"additional_info":{"type":"StructuredText","config":{"multi":"paragraph, preformatted, heading3, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true,"label":"Additional Info","placeholder":"eg. name of person in testimonial"}}}}
{"type":"Slice","fieldset":"Cards Carousel","description":"A carousel with text + image cards","icon":"image","display":"list","non-repeat":{"eyebrow_headline":{"type":"StructuredText","config":{"label":"Eyebrow headline","multi":"paragraph, preformatted, heading1, heading2, heading3, heading4, heading5, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true}},"title":{"type":"StructuredText","config":{"label":"Title","single":"heading1, heading2, heading3, heading4, heading5, heading6"}},"description":{"type":"StructuredText","config":{"label":"Description","multi":"paragraph, preformatted, heading1, heading2, heading3, heading4, heading5, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true}}},"repeat":{"image":{"type":"Image","config":{"label":"Image","constraint":{},"thumbnails":[]}},"title":{"type":"StructuredText","config":{"label":"Title","single":"heading3"}},"content":{"type":"StructuredText","config":{"label":"Content","multi":"paragraph, preformatted, heading1, heading2, heading3, heading4, heading5, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true}},"additional_info":{"type":"StructuredText","config":{"label":"Additional Info","placeholder":"eg. name of person in testimonial","multi":"paragraph, preformatted, heading3, heading6, strong, em, hyperlink, image, embed, list-item, o-list-item, o-list-item","allowTargetBlank":true}}}}}