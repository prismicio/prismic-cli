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
    name: 'NodeJS blog',
    url: 'https://github.com/prismicio/nodejs-blog/archive/master.zip',
    innerFolder: 'nodejs-blog-master',
    configuration: 'prismic-configuration.js',
    instructions: nodeBasedInstructions
  }, {
    name: 'NodeJS',
    url: 'https://github.com/prismicio/nodejs-sdk/archive/master.zip',
    innerFolder: 'nodejs-sdk-master',
    configuration: 'prismic-configuration.js',
    instructions: nodeBasedInstructions
  }, {
    name: 'Angular2',
    url: 'https://github.com/prismicio/angular2-starter/archive/master.zip',
    configuration: 'src/app/app.module.ts',
    innerFolder: 'angular2-starter-master'
  }, {
    name: 'React',
    url: 'https://github.com/prismicio/reactjs-starter/archive/master.zip',
    configuration: 'src/index.jsx',
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

  unzip(template) {
    const tmpZipFile = tmp.tmpNameSync();
    const tmpFolder = tmp.dirSync().name;
    return new Promise(function(resolve, reject) {
      request({uri: template.url})
        .pipe(fs.createWriteStream(tmpZipFile))
        .on('close', function() {
          var zip = new AdmZip(tmpZipFile);
          zip.extractAllTo(tmpFolder, /*overwrite*/true);
          shell.rm(tmpZipFile);
          resolve(tmpFolder);
        });
    });
  },

  replace(folder, template, data) {
    const configPath = `${folder}/${template.configuration}`;
    if (shell.test('-f', configPath)) {
      data.forEach(function(rule) {
        shell.sed('-i', rule.pattern, rule.value, configPath);
      });
    }
  }
};
