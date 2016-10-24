'use strict';

import Communication, { Domain } from './communication';
import Helpers from './helpers';
import Authentication from './authentication';
import Template from './template';

import path from 'path';
import inquirer from 'inquirer';
import _ from 'lodash';
import shell from 'shelljs';

const isWin = /^win/.test(process.platform);

async function createWithDomain(base, domain, args, noconfirm, customTypes) {
  const cookies = await Authentication.connect(base, args, noconfirm);
  Helpers.UI.display('Creating your repository...');
  await queryCreateRepository(base, domain, cookies, customTypes);
  Helpers.UI.display(`You can access your backend here: ${Domain.withDomain(base, domain)}`);
  return domain;
}

async function create(templates, base, domain, args) {
  const noconfirm = args['--noconfirm'] === true;
  const newRepository = args['--new'] === true;

  // Ask user for domain and template
  if (noconfirm && !domain) {
    throw 'The noconfirm options requires the domain option to be set.';
  }
  let finalDomain = domain;
  if (!finalDomain) {
    finalDomain = await promptForNewDomain(base, domain, newRepository);
  }
  const templateAnswers = await promptTemplate(templates, args['--template']);
  const temp = templateAnswers.template;
  // Unzip template in a tmp folder (so we can read the custom types)
  if (!temp.url) {
    throw new Error(`${temp.name} is not implemented yet!`);
  }
  const tmpfolder = await Template.unzip(temp);
  const tmpInner = path.join(tmpfolder, temp.innerFolder);

  // Create repository if needed
  if (newRepository) {
    const customTypes = readCustomTypes(tmpInner);
    await createWithDomain(base, finalDomain, args, noconfirm, customTypes);
  }
  // Create local template
  const folder = await promptFolder(args['--folder'] || finalDomain);
  console.log('Initialize local project...');
  shell.mv(tmpInner, folder);
  Template.replace(folder, temp, [{
    pattern: /your-repo-name/,
    value: finalDomain
  }]);

  // Finalize template (inject repo name and run npm install)
  console.log('Running npm install...');
  var devnull = isWin ? 'NUL' : '/dev/null';
  shell.cd(folder);
  shell.exec('npm install > ' + devnull);
  Helpers.UI.display('Your project is ready, to proceed:\n');
  console.log('Go to the project folder: cd ' + folder);
  if(temp.instructions) {
    Helpers.UI.display(temp.instructions);
  }

  return temp;
}

async function exists(base, domain) {
  const isFree = await queryExists(base, domain);
  return (isFree === 'false');
}

function readCustomTypes(folder) {
  if (folder) {
    const customTypesFolder = path.join(folder, 'custom_types');
    const customTypesPath = path.join(customTypesFolder, 'index.json');
    if (shell.test('-e', customTypesPath)) {
      let customTypes = JSON.parse(shell.cat(customTypesPath));
      customTypes.forEach((t) => {
        const valuePath = path.join(customTypesFolder, t['value']);
        t.value = JSON.parse(shell.cat(valuePath));
      });
      return customTypes;
    }
  }
  return {};
}

async function promptForNewDomain(base, domain, newRepository) {
  let answers = await promptName(domain);
  let doExists = await exists(base, answers.domain);
  if (doExists && newRepository) {
    Helpers.UI.display('This Repository already exists, please choose another name.');
    return promptForNewDomain(base, domain, newRepository);
  } else if (!doExists && !newRepository) {
    Helpers.UI.display('This Repository does not exist, please input an existing repository name.');
    return promptForNewDomain(base, domain, newRepository);
  } else {
    return answers.domain;
  }
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

function queryCreateRepository(base, domain, cookies, customTypes) {
  const url = `${base}/authentication/newrepository`;
  const data = {
    domain: domain,
    plan: 'personal',
    isAnnual: 'false',
    'custom-types': JSON.stringify(customTypes)
  };
  return Communication.post(url, data, cookies);
}

// function queryValidateCLI(base, domain) {
//   const baseWithDomain = Domain.withDomain(base, domain);
//   const url = `${baseWithDomain}/app/settings/onboarding/cli`;
//   return Communication.post(url, {});
// }

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

async function promptFolder(folderName) {
  const answers = await inquirer.prompt([folderQuestion(folderName)]);
  return answers.folder;
}

function promptTemplate(templates, templateName) {
  return inquirer.prompt([templateQuestion(templates, templateName)]);
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
