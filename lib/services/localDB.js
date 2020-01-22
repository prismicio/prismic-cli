import fs from 'fs';
import path from 'path';
import os from 'os';

function configFile() {
  const homedir = os.homedir();
  return path.join(homedir, '.prismic');
}

function save(data) {
  fs.writeFileSync(configFile(), data);
}

export default {
  getAll() {
    try {
      const file = configFile();
      const json = fs.readFileSync(file, 'utf8');
      return JSON.parse(json);
    } catch (ex) {
      return {};
    }
  },

  get(key) {
    const all = this.getAll();
    return all[key];
  },

  set(values) {
    const all = this.getAll();
    Object.assign(all, values);
    const json = JSON.stringify(all, null, 4);
    return save(json);
  },
};
