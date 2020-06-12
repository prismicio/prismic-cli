import path from 'path';
import { snakelize, pascalize } from 'sm-commons/utils/str';

export default {
  apply(id, name, model, isLocal, lib, libPath) {
    if (!id || !name) return null;

    return {
      [name]: {
        id,
        lib,
        libPath: path.normalize(libPath),
        path: path.normalize(path.join(libPath, name, './model.json')),
        model,
        isLocal,
      },
    };
  },

  fromModelPath(modelPath, isLocal, lib, libPath) {
    const name = modelPath
      .replace('/model.json', '')
      .split('/')
      .pop();

    const id = snakelize(name);
    const model = require(modelPath);

    return this.apply(id, name, model, isLocal, lib, libPath);
  },

  nameFromId(id) {
    return pascalize(id);
  },
};
