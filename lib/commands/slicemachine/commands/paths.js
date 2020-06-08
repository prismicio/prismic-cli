import path from 'path';

export const SLICES_EXPORTS_FILENAME = 'index.js';
export const SLICES_FOLDER_NAME = 'slices';

const customTypesRoot = path.join(process.cwd(), 'custom_types');
const slices = path.join(process.cwd(), SLICES_FOLDER_NAME);

const Paths = {
  SmConfig: path.join(process.cwd(), 'sm.json'),
  CustomTypes: {
    rootFolder: customTypesRoot,
    index: path.join(customTypesRoot, 'index.json'),
    customType: id => path.join(customTypesRoot, `${id}.json`),
  },
  Slices: {
    rootFolder: slices,
    exports: path.join(slices, SLICES_EXPORTS_FILENAME),
  },
};

export default Paths;
