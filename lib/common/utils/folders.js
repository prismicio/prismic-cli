import fs from 'fs';
import path from 'path';

export default {
  lsPaths(source, filterFn = () => true) {
    return fs.readdirSync(source)
      .filter(filterFn)
      .map((name) => [path.join(source, name), name]);
  },
  mkdir(pathToFolder) {
    fs.mkdirSync(pathToFolder, { recursive: true });
  },
};
