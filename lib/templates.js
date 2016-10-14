'use strict';

import request from 'request';
import AdmZip from 'adm-zip';
import tmp from 'tmp';
import fs from 'fs';
import shell from 'shelljs';
import Helpers from './helpers';

function nodeBasedInstructions() {
  Helpers.UI.display([
    'To have hot reload: npm install -g nodemon',
    'Start your project: nodemon app.js',
    'Point your browser to: http://localhost:3000'
  ]);
}

export default {
  TEMPLATES : [{
    name: 'NodeJS',
    url: 'https://github.com/prismicio/nodejs-sdk/archive/master.zip',
    innerFolder: 'nodejs-sdk-master',
    instructions: nodeBasedInstructions
  }, {
    name: 'Angular2',
    url: 'https://github.com/prismicio/angular2-starter/archive/master.zip',
    innerFolder: 'angular2-starter-master'
  }, {
    name: 'React',
    url: 'https://github.com/prismicio/reactjs-starter/archive/master.zip',
    innerFolder: 'reactjs-starter-master'
  }],

  get(name) {
    var template = this.TEMPLATES.find(function(tmpl) {
      return tmpl.name === name;
    });
    if (!template) {
      throw new Error('Error: invalid template ' + name);
    }
    return template;
  },

  getOrDefault(name) {
    const t = this.TEMPLATES.find(function(tmpl) {
      return tmpl.name === name;
    });
    return t || this.TEMPLATES[0];
  },

  unzip(template, destination) {
    return new Promise(function(resolve, reject) {
      tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
        request({uri: template.url})
          .pipe(fs.createWriteStream(path))
          .on('close', function() {
            var zip = new AdmZip(path);
            zip.extractAllTo('.', /*overwrite*/true);
            if (destination) {
              shell.mv(template.innerFolder, destination);
            } else {
              shell.mv(template.innerFolder + '/*', '.');
              shell.rm('-r', template.innerFolder);
            }
            cleanupCallback();
            resolve(true);
          });
      });
    });
  },

  replace(folder, data) {
    shell.ls('-R', folder).forEach(function(file) {
      var path = folder + '/' + file;
      if (shell.test('-f', path)) {
        data.forEach(function(rule) {
          shell.sed('-i', rule.pattern, rule.value, path);
        });
      }
    });
  }
};
