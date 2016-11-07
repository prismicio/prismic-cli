'use strict';

import Communication, { Domain } from './communication';
import Helpers from './helpers';
import Authentication from './authentication';
import Template from './template';

import inquirer from 'inquirer';
import _ from 'lodash';
import shell from 'shelljs';

const isWin = /^win/.test(process.platform);

function createWithDomain(base, domain, args, customTypes, noconfirm) {
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
      isDomainAvailableOrRetry(newRepository, base, domain, args, noconfirm)
      .then((domainInfos) => resolve(domainInfos))
      .catch((err) => console.log(err));
    } else if (noconfirm) {
      throw 'The noconfirm options requires the domain option to be set.';
    } else {
      promptName()
      .then((answers) => {
        isDomainAvailableOrRetry(newRepository, base, answers.domain, args, noconfirm)
        .then((domainInfos) => resolve(domainInfos));
      });
    }
  })
  .then((domainInfos) => {
    return requireFolderAndTemplate(templates, domainInfos.domain, args['--folder'], args['--template'], noconfirm)
    .then((data) => {
      if (!data.template.url) {
        throw new Error(`${data.template.name} is not implemented yet!`);
      }
      return Helpers.Json.merge(domainInfos, data);
    });
  })
  .then((data) => {
    return Template.unzip(data.template, data.folder)
    .then(function() {
      Template.replace(data.folder, data.template, [{
        pattern: /your-repo-name/,
        value: domain
      }]);
      return data;
    });
  })
  .then((data) => {
    Helpers.UI.display('Initialize local project...');
    if(!data.isCreated) {
      return createWithDomain(base, data.domain, args, noconfirm)
      .then((d) => data)
      .catch((err) => {
        throw new Error(err);
      });
    } else {
      return data;
    }
  })
  .then((data) => {
    if (data && data.folder) {
      queryValidateCLI(base, data.domain);
      Helpers.UI.display('Running npm install...');
      var devnull = isWin ? 'NUL' : '/dev/null';
      shell.cd(data.folder);
      shell.exec('npm install > ' + devnull);
      Helpers.UI.display('Your project is ready, to proceed:\n');
      Helpers.UI.display('Go to the project folder : cd ' + data.folder);
      if(data.template.instructions) {
        Helpers.UI.display(data.template.instructions);
      }
    }
    return data.template;
  })
  .catch((err) => Helpers.UI.display(err || 'Repository creation aborted !'));
}

function isDomainAvailableOrRetry(newRepository, base, domain, args, noconfirm) {
  return new Promise((resolve, reject) => {
    function exec(d) {
      exists(newRepository, base, d, args, noconfirm)
      .then((isExist) => {
        if(isExist) {
          if(newRepository) {
            retry('This Repository already exists, please choose another name.');
          } else {
            resolve({domain: d, isCreated: true});
          }
        }
        else {
          if(noconfirm || newRepository) {
            resolve({domain: d, isCreated: false});
          } else {
            retry('Either the repository doesn\'t exists or you don\'t have access to it.');
          }
        }
      })
      .catch((err) => {
        Helpers.UI.display(err);
        reject();
      });
    }

    function retry(err) {
      Helpers.UI.display(err);
      promptName()
      .then((answers) => {
        exec(answers.domain);
      });
    }
    exec(domain);
  });
}

function exists(newRepository, base, domain, args, noconfirm) {
  return new Promise((resolve, reject) => {
    return queryExists(base, domain)
    .then(function (exists) {
      const isExists = exists === 'false';
      resolve(isExists);
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

function requireFolderAndTemplate(templates, domain, foldername, templateName, noconfirm) {
  if (noconfirm || (foldername && templateName)) {
    const folder = foldername || domain;
    const temp = Template.getOrDefault(templates, templateName);
    if (shell.test('-e', folder)) {
      throw new Error('Error: folder '+ folder + ' already exists.');
    }
    if (!temp) {
      throw new Error('Error: invalid template ' + templateName);
    }
    return Promise.resolve(buildAnswers(folder, temp));
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

function heroku(templates, templateName) {
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
