'use strict';

import request from 'request';
import AdmZip from 'adm-zip';
import tmp from 'tmp';
import fs from 'fs';
import shell from 'shelljs';

export default {
  get(templates, name) {
    var template = this.TEMPLATES.find(function(tmpl) {
      return tmpl.name === name;
    });
    if (!template) {
      throw new Error('Error: invalid template ' + name);
    }
    return template;
  },

  getOrDefault(templates, name) {
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

  replace(folder, template, data) {
    const configPath = `${folder}/${template.configuration}`;
    if (shell.test('-f', configPath)) {
      data.forEach(function(rule) {
        shell.sed('-i', rule.pattern, rule.value, configPath);
      });
    }
  }
};
