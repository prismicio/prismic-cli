import { parse } from 'vue-docgen-api';
import path from 'path';
import { Files, Folders, snakecalize } from './utils';

const FileSystem = {
  _pathToSlices: (source) => {
    try {
      return Folders.lsPaths(source)
        .filter(url => path.extname(url) === '.vue' || Files.isDirectory(url))
        .map(e => (path.extname(e) === '.vue' ? e : `${e}/index.vue`));
    } catch (e) {
      return [];
    }
  },

  _extractSliceModel: (slicePath) => {
    try {
      const { displayName } = parse(slicePath);
      const pathToModel = slicePath.substring(0, slicePath.lastIndexOf('/')).concat('/model.json');
      const model = Files.readJson(pathToModel);
      return [displayName, model];
    } catch (e) {
      return null;
    }
  },

  // returns the slices by key { [key]: sliceModel }
  extractSlicesModels: (sliceFolderPath) => {
    const componentsPaths = FileSystem._pathToSlices(sliceFolderPath);
    const slicesModels = componentsPaths.map(FileSystem._extractSliceModel).filter(e => Boolean(e));

    return slicesModels.reduce((acc, [key, value]) => ({ ...acc, [snakecalize(key)]: value }), {});
  },
};

export default FileSystem;

export const FileType = {
  Folder: 'folder',
  File: 'File',
};
