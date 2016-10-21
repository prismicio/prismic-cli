'use strict';

import Communication, { Domain } from './communication';
import Helpers from './helpers';
import Authentication from './authentication';
import Template from './template';

import inquirer from 'inquirer';
import _ from 'lodash';
import shell from 'shelljs';

const isWin = /^win/.test(process.platform);

function createWithDomain(base, domain, args, noconfirm) {
  return new Promise((resolve, reject) => {
    Authentication.connect(base, args, noconfirm)
    .then(function (cookies) {
      queryCreateRepository(base, domain, cookies)
      .then(() => {
        Helpers.UI.display(`You can access your backend here: ${Domain.withDomain(base, domain)}`);
        resolve(domain);
      })
      .catch((err) => {
        Helpers.UI.display(err);
        reject();
      });
    });
  });
}

function create(templates, base, domain, args) {
  const noconfirm = args['--noconfirm'] === true;
  const newRepository = args['--new'] === true;
  return new Promise((resolve, reject) => {
    if (domain) {
      exists(newRepository, base, domain, args, noconfirm)
      .then((isExist) => {
        if(isExist) resolve(domain);
        else reject();
      })
      .catch((err) => {
        Helpers.UI.display(err);
        promptName()
        .then((answers) => {
          create(base, answers.domain, args);
        });
      });
    } else if (noconfirm) {
      throw 'The noconfirm options requires the domain option to be set.';
    } else {
      promptName()
      .then((answers) => {
        exists(newRepository, base, answers.domain, args, noconfirm)
        .then((isExist) => {
          if(isExist) resolve(answers.domain);
          else reject();
        })
        .catch((err) => {
          Helpers.UI.display(err);
          promptName()
          .then((answers) => {
            create(base, answers.domain, args);
          });
        });
      });
    }
  })
  .then((finalDomain) => {
    if(!finalDomain) {
      Helpers.UI.display('Init aborted.');
    } else {
      return initTemplate(templates, finalDomain, args['--folder'], args['--template'], noconfirm)
      .then((answers) => {
        if (answers && answers.folder) {
          queryValidateCLI(base, finalDomain);
          console.log('Running npm install...');
          var devnull = isWin ? 'NUL' : '/dev/null';
          shell.cd(answers.folder);
          shell.exec('npm install > ' + devnull);
          Helpers.UI.display('Your project is ready, to proceed:\n');
          console.log('Go to the project folder : cd ' + answers.folder);
          if(answers.template.instructions) {
            Helpers.UI.display(answers.template.instructions);
          }
        }
        return answers.template;
      });
    }
  })
  .catch((err) => Helpers.UI.display(err || 'Repository creation aborted !'));
}

function exists(newRepository, base, domain, args, noconfirm) {
  return new Promise((resolve, reject) => {
    return queryExists(base, domain)
    .then(function (exists) {
      const isExists = exists === 'false';
      if (!isExists) {
        if(noconfirm || newRepository) {
          createWithDomain(base, domain, args, noconfirm)
          .then((d) => resolve(true));
        } else {
          reject('Either the repository doesn\'t exists or you don\'t have access to it.');
        }
      } else {
        if(newRepository) {
          reject('This Repository already exists, please choose another name.');
        } else {
          return resolve(true);
        }
      }
    })
    .catch((err) => {
      Helpers.UI.display(`Unable to check if ${domain} exists.`);
    });
  });
}

function promptName (domain) {
  return inquirer.prompt([{
    type: 'input',
    name: 'domain',
    message: 'Name your prismic repository: ',
    default: domain
  }]);
}

function queryExists(base, domain) {
  const url = `${base}/app/dashboard/repositories/${domain}/exists`;
  return Communication.get(url);
}

function queryCreateRepository(base, domain, cookies) {
  const url = `${base}/authentication/newrepository`;
  const data = {
    domain: domain,
    plan: 'personal',
    isAnnual: 'false'
  };
  return Communication.post(url, data, cookies);
}

function queryValidateCLI(base, domain) {
  const baseWithDomain = Domain.withDomain(base, domain);
  const url = `${baseWithDomain}/app/settings/onboarding/cli`;
  return Communication.post(url, {});
}

function folderQuestion(folderName) {
  return {
    type: 'input',
    name: 'folder',
    message: 'Local folder to initalize project: ',
    default: folderName,
    validate: function(value) {
      return (shell.test('-e', value)) ? 'Folder already exists' : true;
    }
  };
}

function templateQuestion(templates, templateName) {
  return {
    type: 'list',
    name: 'template',
    message: 'Technology for your project: ',
    default: _(templates).findIndex(function(tmpl) { return tmpl.name === templateName; }),
    choices: _.map(templates, function(template) {
      return {
        name: template.name,
        value: template
      };
    })
  };
}

function promptFolder(folderName) {
  return inquirer.prompt([folderQuestion(folderName)]);
}

function promptTemplate(templates, templateName) {
  return inquirer.prompt([templateQuestion(templates, templateName)]);
}

function promptFolderAndTemplate(templates, folderName, templateName) {
  return inquirer.prompt([folderQuestion(folderName), templateQuestion(templates, templateName)]);
}

function buildAnswers(folder, template) {
  return { folder, template };
}

function initTemplate(templates, domain, foldername, templateName, noconfirm) {
  return requireFolderAndTemplate(templates, domain, foldername, templateName, noconfirm)
  .then(function(answers) {
    const folder = answers.folder;
    if (!answers.template.url) {
      throw new Error(`${answers.template.name} is not implemented yet!`);
    }
    console.log('Initialize local project...');
    return Template.unzip(answers.template, folder)
    .then(function() {
      Template.replace(folder, answers.template, [{
        pattern: /your-repo-name/,
        value: domain
      }]);
      return answers;
    });
  });
}

function requireFolderAndTemplate(templates, domain, foldername, templateName, noconfirm) {
  if (noconfirm || (foldername && templateName)) {
    const folder = foldername || domain;
    const template = Template.getOrDefault(templates, templateName);
    if (shell.test('-e', folder)) {
      throw new Error('Error: folder '+ folder + ' already exists.');
    }
    if (!template) {
      throw new Error('Error: invalid template ' + templateName);
    }
    return Promise.resolve(buildAnswers(folder, template));
  } else if (templateName) {
    return promptFolder(foldername || domain)
    .then((answers) => buildAnswers(answers.folder, Template.get(templates, templateName)));
  } else if (foldername) {
    return promptTemplate(templates, templateName)
    .then((answers) => buildAnswers(answers.folder, Template.get(templates, answers.template)));
  } else {
    return promptFolderAndTemplate(templates, foldername || domain, templateName)
    .then((answers) => buildAnswers(answers.folder, answers.template));
  }
}

function heroku(templateName) {
  var template = Template.get(templates, templateName);
  Helpers.UI.display('Initialize heroku project');
  (template ? Promise.resolve({template: Template.get(templates, templateName)}) : promptTemplate(templateName))
  .then(function(answers) {
    if (!answers.template.url) {
      throw new Error('Not implemented yet!');
    }
    Helpers.UI.display('Initialize local project...');
    return Template.unzip(answers.template).then(function() {
      Template.replace('.', answers.template, [{
        pattern: /[\'\"]https:\/\/your-repo-name\.prismic\.io\/api[\'\"]/,
        value: 'process.env.PRISMIC_ENDPOINT'
      }]);
      Helpers.UI.display('Running npm install...');
      shell.exec(`npm install > ${isWin ? 'NUL' : '/dev/null'}`);
      Helpers.UI.display([
        'Your project in ready! Next steps:',
        ' => Open your writing room: \'heroku addons:docs prismic\'',
        ' => Create the custom types as described in the docs: \'heroku addons:docs prismic\'',
        ' => Run the project: \'heroku local\''
      ]);
    });
  });
}

export default { create, heroku };
