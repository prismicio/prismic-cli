'use strict';

var fs = require('fs');
var path = require('path');

function configFile() {
  var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  return path.join(home, '.prismic');
}

exports.save = function(cookies) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(configFile(), cookies, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

exports.read = function() {
  return new Promise(function(resolve, reject) {
    var file = configFile();
    fs.stat(file, function(err, stat) {
      if (err) {
        // File doesn't exist
        resolve(null);
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
};


