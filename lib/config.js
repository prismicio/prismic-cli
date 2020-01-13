import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import os from 'os';

function configFile() {
  const homedir = os.homedir();
  return path.join(homedir, '.prismic');
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
  async getAll() {
    const json = await read();
    try {
      return JSON.parse(json);
    }
    catch (ex) {
      console.error(`[config] Error reading config file`);
      return {};
    }
  },

  async get(key) {
    const all = await this.getAll();
    return all[key];
  },

  async set(values) {
    const all = await this.getAll();
    _.extend(all, values);
    const json = JSON.stringify(all, null, 4);
    return save(json);
  },
};
