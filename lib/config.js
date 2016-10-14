'use strict';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';

function configFile() {
  var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  return path.join(home, '.prismic');
}

function save(data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(configFile(), data, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function read() {
  return new Promise(function(resolve, reject) {
    var file = configFile();
    fs.stat(file, function(err, stat) {
      if (err) {
        // File doesn't exist
        resolve({});
      } else {
        fs.readFile(file, 'utf8', function (err, data) {
          if (err) {
            return reject(err);
          } else {
            return resolve(data);
          }
        });
      }
    });
  });
}

export default {
  getAll() {
    return read().then(function (json) {
      try {
        return JSON.parse(json);
      } catch (ex) {
        return {};
      }
    });
  },

  get(key) {
    return this.getAll().then(function(all) {
      return all[key];
    });
  },

  set(values) {
    return this.getAll().then(function(all) {
      _.extend(all, values);
      var json = JSON.stringify(all, null, 4);
      return save(json);
    });
  }
};

