'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _communication = require('./communication');

var _communication2 = _interopRequireDefault(_communication);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _authentication = require('./authentication');

var _authentication2 = _interopRequireDefault(_authentication);

var _templates = require('./templates');

var _templates2 = _interopRequireDefault(_templates);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isWin = /^win/.test(process.platform);

function createWithDomain(base, domain, args) {
  return new Promise(function (resolve, reject) {
    _authentication2.default.connect(base, args).then(function (cookies) {
      queryCreateRepository(base, domain, cookies).then(function () {
        return resolve(domain);
      }).catch(function (err) {
        reject();
      });
    });
  });
}

function create(base, domain, args) {
  var noconfirm = args['--noconfirm'] === 'true';
  return new Promise(function (resolve, reject) {
    var pDomain = null;
    if (domain) {
      exists(base, domain, args).then(function (isExist) {
        if (isExist) resolve(domain);else reject('We didn\'t create the new repository ' + domain);
      }).catch(function () {
        return reject();
      });
    } else if (noconfirm) {
      throw 'The noconfirm options requires the domain option to be set.';
    } else {
      promptName().then(function (answers) {
        exists(base, answers.domain, args).then(function (isExist) {
          if (isExist) resolve(answers.domain);else reject('We didn\'t create the new repository ' + domain);
        });
      });
    }
  }).then(function (finalDomain) {
    if (!finalDomain) {
      _helpers2.default.UI.display('Init aborted.');
    } else {
      return initTemplate(finalDomain, args['--folder'], args['--template'], noconfirm).then(function (answers) {
        if (answers && answers.folder) {
          queryValidateCLI(base, finalDomain);
          console.log('Running npm install...');
          var devnull = isWin ? 'NUL' : '/dev/null';
          _shelljs2.default.cd(answers.folder);
          _shelljs2.default.exec('npm install > ' + devnull);
          console.log('Go to the project folder : cd ' + answers.folder);
          if (answers.template.instructions) {
            answers.template.instructions();
          }
        }
        return anwsers.template;
      });
    }
  }).catch(function (msg) {
    return _helpers2.default.UI.display(msg || 'Repository creation aborted !');
  });
}

function exists(base, domain, args) {
  return new Promise(function (resolve, reject) {
    return queryExists(base, domain).then(function (exists) {
      var isExists = exists === 'false';
      if (!isExists) {
        return promptCreateIfNotExists().then(function (answers) {
          if (answers.createIfNotExist) createWithDomain(base, domain, args).then(function (d) {
            return resolve(true);
          });else return resolve(false);
        });
      } else {
        return resolve(true);
      }
    }).catch(function (err) {
      _helpers2.default.UI.display('Unable to check if ' + domain + ' exists.');
    });
  });
}

function promptName(domain) {
  return _inquirer2.default.prompt([{
    type: 'input',
    name: 'domain',
    message: 'Domain name: ',
    default: domain
  }]);
};

function promptCreateIfNotExists() {
  return _inquirer2.default.prompt([{
    type: 'confirm',
    name: 'createIfNotExist',
    message: 'This repository doesn\'t exists. Do you want to create it?'
  }]);
}

function queryExists(base, domain) {
  var url = base + '/app/dashboard/repositories/' + domain + '/exists';
  return _communication2.default.get(url);
}

function queryCreateRepository(base, domain, cookies) {
  var url = base + '/authentication/newrepository';
  var data = {
    domain: domain,
    plan: 'personal',
    isAnnual: 'false'
  };
  return _communication2.default.post(url, data, cookies);
}

function queryValidateCLI(base, domain) {
  var baseWithDomain = _communication.Domain.WithDomain(base, domain);
  var url = baseWithDomain + '/app/settings/onboarding/cli';
  return _communication2.default.get(url);
}

function folderQuestion(folderName) {
  return {
    type: 'input',
    name: 'folder',
    message: 'Local folder to initalize project: ',
    default: folderName,
    validate: function validate(value) {
      return _shelljs2.default.test('-e', value) ? 'Folder already exists' : true;
    }
  };
}

function templateQuestion(templateName) {
  return {
    type: 'list',
    name: 'template',
    message: 'Technology for your project: ',
    default: (0, _lodash2.default)(_templates2.default.TEMPLATES).findIndex(function (tmpl) {
      return tmpl.name === templateName;
    }),
    choices: _lodash2.default.map(_templates2.default.TEMPLATES, function (template) {
      return {
        name: template.name,
        value: template
      };
    })
  };
}

function promptFolder(folderName) {
  return _inquirer2.default.prompt([folderQuestion(folderName)]).then(function (answers) {
    answers.template = template;
    return answers;
  });
}

function promptTemplate(templateName) {
  return _inquirer2.default.prompt([templateQuestion(templateName)]);
}

function promptFolderAndTemplate(folderName, templateName) {
  return _inquirer2.default.prompt([folderQuestion(folderName), templateQuestion(templateName)]);
}

function buildAnswers(folder, template) {
  return { folder: folder, template: template };
}

function initTemplate(domain, foldername, templateName, noconfirm) {
  var answersPromise, template;
  return requireFolderAndTemplate(domain, foldername, templateName, noconfirm).then(function (answers) {
    var folder = answers.folder;
    if (!answers.template.url) {
      throw new Error(answers.template.name + ' is not implemented yet!');
    }
    console.log('Initialize local project...');
    return _templates2.default.unzip(answers.template, folder).then(function () {
      _templates2.default.replace(folder, [{
        pattern: /your-repo-name/,
        value: domain
      }]);
      return answers;
    });
  });
}

function requireFolderAndTemplate(domain, foldername, templateName, noconfirm) {
  if (noconfirm || foldername && templateName) {
    var folder = foldername || domain;
    template = _templates2.default.getOrDefault(templateName);
    if (_shelljs2.default.test('-e', folder)) {
      throw new Error('Error: folder ' + folder + ' already exists.');
    }
    if (!template) {
      throw new Error('Error: invalid template ' + templateName);
    }
    return Promise.resolve(buildAnswers(folder, template));
  } else if (templateName) {
    return promptFolder(foldername || domain).then(function (answers) {
      return buildAnswers(answers.folder, _templates2.default.get(templateName));
    });
  } else if (foldername) {
    return promptTemplate(templateName).then(function (answers) {
      return buildAnswers(answers.folder, _templates2.default.get(answers.template));
    });
  } else {
    return promptFolderAndTemplate(foldername || domain, templateName).then(function (answers) {
      return buildAnswers(answers.folder, answers.template);
    });
  }
}

exports.default = { create: create };


function heroku(templateName) {
  var answersPromise;
  if (templateName) {
    var template = _templates2.default.get(templateName);
    answersPromise = Promise.resolve({
      template: template
    });
  } else {
    answersPromise = new _inquirer2.default.prompt([templateQuestion(templateName)]);
  }
  return answersPromise.then(function (answers) {
    if (!answers.template.url) {
      throw new Error('Not implemented yet!');
    }
    console.log('Initialize local project...');
    return _templates2.default.unzip(answers.template).then(function () {
      _templates2.default.replace('.', [{
        pattern: /[\'\"]https:\/\/your-repo-name\.prismic\.io\/api[\'\"]/,
        value: 'process.env.PRISMIC_ENDPOINT'
      }]);
      return answers;
    });
  });
}