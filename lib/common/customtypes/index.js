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
    customType: id => path.join(customTypesRoot, `${id}.json`),
  },
};

const CustomTypes = {
  /**
 * Merges slices models with custom types
 * @param  {Array} ct                 Array of custom_types [{ id: 'page', name: 'Page', value: {} }]
 * @param  {Object} slices            Slices definitions { main_header: {}, other_slice: {}}
 * @return {Array}                    Merged custom types
 */
  mergeSlices(ct, slices) {
    return ct.map((elem) => {
      const entries = Object.entries(elem.value || {})
        .reduce((acc, [key, value]) => {
          const szKeys = Object.keys(value).filter(e => value[e].type === 'Slices');
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
          const currSlices = get(elem.value[key][szKey], 'config.choices', {});
          const merged = merge(currSlices, slices);
          set(elem, `value.${key}.${szKey}.config.choices`, merged);
        });
      });
      return elem;
    });
  },

  buildMetadata(customTypes) {
    return customTypes.map(elem => ({
      id: elem.mask_id,
      name: elem.mask_name,
      repeatable: elem.mask_repeatable,
      value: `${elem.mask_id}.json`,
    }));
  },

  // writes the custom types in the filesystem
  write(customTypes) {
    const metadata = CustomTypes.buildMetadata(customTypes);
    Folders.mkdir(Paths.CustomTypes.rootFolder);
    // write custom types metadata
    Files.writeJson(Paths.CustomTypes.index, metadata);
    // write custom types definitions
    customTypes.forEach(({ mask_id: maskId, mask_value: maskValue }) => {
      Files.writeJson(Paths.CustomTypes.customType(maskId), maskValue);
    });
  },

  read() {
    const paths = Folders.lsPaths(Paths.CustomTypes.rootFolder, name => name !== 'index.json');
    return paths
      .map(([filePath, fileName]) => {
        const ctName = fileName.replace('.json', '');
        const ctValue = Files.readJson(filePath);
        return { [ctName]: ctValue };
      });
  },
};

export default CustomTypes;
