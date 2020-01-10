import _ from 'lodash';
import fs from 'fs';
import path from 'path';

function configFile() {
  const home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  return path.join(home, '.prismic');
}

function save(data) {
  return new Promise((resolve, reject) => {
    console.log('saving config here ->', configFile())
    fs.writeFile(configFile(), data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function read() {
  return new Promise((resolve, reject) => {
    const file = configFile();
    fs.stat(file, (err) => {
      if (err) {
        // File doesn't exist
        resolve({});
      } else {
        fs.readFile(file, 'utf8', (errfile, data) => {
          if (err) {
            return reject(errfile);
          }
          return resolve(data);
        });
      }
    });
  });
}

export default {
  getAll() {
    return read().then((json) => {
      try {
        return JSON.parse(json);
      } catch (ex) {
        console.error(`[config] Error reading config file`)
        return {};
      }
    });
  },

  get(key) {
    return this.getAll().then(all => all[key]);
  },

  set(values) {
    return this.getAll().then((all) => {
      _.extend(all, values);
      const json = JSON.stringify(all, null, 4);
      return save(json);
    });
  },
};
