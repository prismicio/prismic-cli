import fs from 'fs';
import path from 'path';
import os from 'os';
import Sentry from '../services/sentry';

function configFile() {
  const homedir = os.homedir();
  return path.join(homedir, '.prismic');
}

function save(data) {
  fs.writeFileSync(configFile(), data);
}

function read() {
  const file = configFile();
  fs.statSync(file);
  return fs.readFileSync(file, 'utf8');
}

export default {
  getAll() {
    try {
      const json = read();
      return JSON.parse(json);
    } catch (ex) {
      Sentry.report(ex);
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
