'use strict';

var request = require('request');
var AdmZip = require('adm-zip');
var tmp = require('tmp');
var fs = require('fs');
var shell = require('shelljs');

function nodeBasedInstructions() {
  console.log('Install nodemon to have hot reload : npm install -g nodemon');
  console.log('Start your project with nodemon: nodemon app.js');
  console.log('Run your project : http://localhost:3000');
}

exports.TEMPLATES = [{
  name: 'NodeJS',
  url: 'https://github.com/prismicio/nodejs-sdk/archive/master.zip',
  innerFolder: 'nodejs-sdk-master',
  instructions: nodeBasedInstructions
}, {
  name: 'NodeJS-blog',
  url: 'https://github.com/prismicio/nodejs-blog/archive/master.zip',
  innerFolder: 'nodejs-blog-master',
  instructions: nodeBasedInstructions
}, {
  name: 'Angular2',
  url: 'https://github.com/prismicio/angular2-starter/archive/master.zip',
  innerFolder: 'angular2-starter-master'
}, {
  name: 'React',
  url: 'https://github.com/prismicio/reactjs-starter/archive/master.zip',
  innerFolder: 'reactjs-starter-master'
}];

exports.get = function (name) {
  var template = exports.TEMPLATES.find(function (tmpl) {
    return tmpl.name === name;
  });
  if (!template) {
    throw new Error('Error: invalid template ' + name);
  }
  return template;
};

exports.unzip = function (template, destination) {
  return new Promise(function (resolve, reject) {
    tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
      request({ uri: template.url }).pipe(fs.createWriteStream(path)).on('close', function () {
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
};

exports.replace = function (folder, data) {
  shell.ls('-R', folder).forEach(function (file) {
    var path = folder + '/' + file;
    if (shell.test('-f', path)) {
      data.forEach(function (rule) {
        shell.sed('-i', rule.pattern, rule.value, path);
      });
    }
  });
};