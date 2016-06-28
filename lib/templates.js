'use strict';

var request = require('request');
var AdmZip = require('adm-zip');
var tmp = require('tmp');
var fs = require('fs');

exports.TEMPLATES = [{
  name: 'NodeJS',
  url: 'https://github.com/prismicio/nodejs-sdk/archive/2.0.1.zip',
  innerFolder: 'nodejs-sdk-2.0.1'
}, {
  name: 'AngularJS',
  url: ''
}, {
  name: 'React',
  url: ''
}];

exports.unzip = function(template, destination) {
  return new Promise(function(resolve, reject) {
    tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
      request({uri: template.url})
        .pipe(fs.createWriteStream(path))
        .on('close', function() {
          var zip = new AdmZip(path);
          zip.extractAllTo('.', /*overwrite*/true);
          fs.rename(template.innerFolder, destination);
          cleanupCallback();
          resolve(true);
        });
    });
  });
};


