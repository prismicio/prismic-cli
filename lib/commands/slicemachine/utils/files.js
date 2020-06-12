import fs from 'fs';

export default {
  ERROR_CODES: {
    ENOENT: 'ENOENT',
  },

  _format: 'utf8',
  writeJson(pathToFile, jsValue) {
    fs.writeFileSync(pathToFile, JSON.stringify(jsValue, null, 2), this._format);
  },
  readJson(pathToFile) {
    return JSON.parse(fs.readFileSync(pathToFile, this._format));
  },
  isDirectory: source => fs.lstatSync(source).isDirectory(),
  exists(pathToFile) {
    try {
      return Boolean(fs.lstatSync(pathToFile));
    } catch (e) {
      if (e.code === this.ERROR_CODES.ENOENT) return false;
      throw e;
    }
  },
  append(filePath, data) {
    fs.appendFileSync(filePath, data);
  },

  copy(src, dest) {
    fs.copyFileSync(src, dest);
  },
};
