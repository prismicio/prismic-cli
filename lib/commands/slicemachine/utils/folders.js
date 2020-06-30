import fs from 'fs';
import path from 'path';

export default {
  lsPaths(source) {
    return fs.readdirSync(source)
      .map(name => path.join(source, name));
  },
  mkdir(pathToFolder) {
    fs.mkdirSync(pathToFolder, { recursive: true });
  },
};
