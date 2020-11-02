import fs from 'fs';

const ERROR_CODES = {
  ENOENT: 'ENOENT',
};

const Files = {
  _format: 'utf8',
  writeJson(pathToFile, jsValue) {
    Files.write(pathToFile, JSON.stringify(jsValue, null, 2));
  },
  write(pathToFile, text) {
    fs.writeFileSync(pathToFile, text, this._format);
  },
  read(pathToFile) {
    return fs.readFileSync(pathToFile, this._format);
  },
  readJson(pathToFile) {
    return JSON.parse(this.read(pathToFile));
  },
  isDirectory: source => fs.lstatSync(source).isDirectory(),
  exists(pathToFile) {
    try {
      return Boolean(fs.lstatSync(pathToFile));
    } catch (e) {
      if (e.code === ERROR_CODES.ENOENT) return false;
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

export default Files;
