import path from 'path';
import { Files, Folders } from '../utils';

const set = require('lodash.set');
const get = require('lodash.get');
const merge = require('lodash.merge');

const customTypesRoot = path.join(process.cwd(), 'custom_types');
const Paths = {
  CustomTypes: {
    rootFolder: customTypesRoot,
    index: path.join(customTypesRoot, 'index.json'),
    customType: (id) => path.join(customTypesRoot, `${id}.json`),
  },
};

const CustomTypes = {
  /**
 * Merges slices models with custom types
 * @param  {Array} ct                 Array of custom_types [{ id: 'page', name: 'Page', value: {} }]
 * @param  {Object} slices            Slices definitions { main_header: {}, other_slice: {}}
 * @return {Array}                    Merged custom types
 */
  mergeSlices(customTypeValue, slices) {
    const entries = Object.entries(customTypeValue || {})
      .reduce((acc, [key, value]) => {
        const szKeys = Object.keys(value).filter((e) => value[e].type === 'Slices');
        if (szKeys.length) {
          return [...acc, [key, szKeys]];
        }
        return acc;
      }, []);

    if (!entries.length) {
      return null;
    }

    entries.forEach((entry) => {
      const [key, szKeys] = entry;
      szKeys.forEach((szKey) => {
        const currSlices = get(customTypeValue[key][szKey], 'config.choices', {});
        const merged = merge(currSlices, slices);
        set(customTypeValue, `${key}.${szKey}.config.choices`, merged);
      });
    });
    return customTypeValue;
  },

  buildMetadata(customTypes, mapperFn = (customType) /* { id, name, repeatable, value } */ => customType) {
    return customTypes.map((elem) => {
      const { id, name, repeatable } = mapperFn(elem);
      return {
        id,
        name,
        repeatable,
        value: `${id}.json`,
      };
    });
  },

  // writes the custom types in the filesystem
  write(customTypes, mapperFn = (customType) /* { id, name, repeatable, value } */ => customType) {
    const metadata = CustomTypes.buildMetadata(customTypes, mapperFn);
    Folders.mkdir(Paths.CustomTypes.rootFolder);
    // write custom types metadata
    Files.writeJson(Paths.CustomTypes.index, metadata);
    // write custom types definitions
    customTypes.map(mapperFn).forEach(({ id: maskId, value: maskValue }) => {
      Files.writeJson(Paths.CustomTypes.customType(maskId), maskValue);
    });
  },

  read() {
    const INDEX_FILENAME = 'index.json';

    const paths = Folders.lsPaths(Paths.CustomTypes.rootFolder, (name) => name !== INDEX_FILENAME);
    const index = Files.readJson(path.join(Paths.CustomTypes.rootFolder, INDEX_FILENAME)).reduce((acc, indexCT) => ({ ...acc, [indexCT.id]: indexCT }), {});
    return paths
      .map(([filePath, fileName]) => {
        const ctId = fileName.replace('.json', '');
        const indexData = index[ctId];
        const ctValue = Files.readJson(filePath);
        return { ...indexData, value: ctValue };
      });
  },
};

export default CustomTypes;
