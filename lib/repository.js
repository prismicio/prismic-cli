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

async function createWithDomain(base, domain, args, customTypes, noconfirm) {
  const cookies = await Authentication.connect(base, args, noconfirm);
  await queryCreateRepository(base, domain, cookies, customTypes);
  Helpers.UI.display(`You can access your backend here: ${Domain.withDomain(base, domain)}`);
  return domain;
}

async function create(templates, base, domain, args) {
  const noconfirm = args['--noconfirm'] === true;
  const newRepository = args['--new'] === true;

  const d = await chooseDomain(newRepository, base, domain, args, noconfirm);
  const {template, folder} = await chooseTemplateAndFolder(d, templates, args, noconfirm);
  await readZipAndCreateRepoWithCustomTypes(newRepository, base, d, args, template, folder, noconfirm);
  await installAndDisplayInstructions(base, d, template, folder);
}

async function chooseDomain(newRepository, base, domain, args, noconfirm) {
  if (domain) {
    return isDomainAvailableOrRetry(newRepository, base, domain, args, noconfirm);
  } else if (noconfirm) {
    throw 'The noconfirm options requires the domain option to be set.';
  } else {
    return promptName().then((answers) => isDomainAvailableOrRetry(newRepository, base, answers.domain, args, noconfirm));
  }
}

async function chooseTemplateAndFolder(domain, templates, args, noconfirm) {
  const data = await requireFolderAndTemplate(templates, domain, args['--folder'], args['--template'], noconfirm);
  if (!data.template.url) {
    throw new Error(`${data.template.name} is not implemented yet!`);
  }
  return data;
}

async function readZipAndCreateRepoWithCustomTypes(newRepository, base, domain, args, template, folder, noconfirm) {
  const tmpfolder = await Template.unzip(template);
  const tmpInner = path.join(tmpfolder, template.innerFolder);
  const initTemplate = () => {
    Helpers.UI.display('Initialize local project');
    shell.mv(tmpInner, folder);
    Template.replace(folder, template, [{
      pattern: /your-repo-name/,
      value: domain
    }]);
  };
  // Create repository if needed
  if (newRepository) {
    const customTypes = readCustomTypes(tmpInner);
    await createWithDomain(base, domain, args, customTypes, noconfirm);
  }
  initTemplate();
  return;
}

function installAndDisplayInstructions(base, domain, template, folder) {
  if (folder) {
    queryValidateCLI(base, domain);
    Helpers.UI.display('Running npm install...');
    var devnull = isWin ? 'NUL' : '/dev/null';
    shell.cd(folder);
    shell.exec('npm install > ' + devnull);
    Helpers.UI.display('Your project is ready, to proceed:\n');
    Helpers.UI.display('Go to the project folder : cd ' + folder);
    if(template.instructions) {
      Helpers.UI.display(template.instructions);
    }
  }
  return template;
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

async function isDomainAvailableOrRetry(newRepository, base, domain, args, noconfirm) {
  async function exec(d) {
    const isExist = await exists(newRepository, base, d, args, noconfirm);
    if(isExist) {
      if(newRepository) {
        return retry('This Repository already exists, please choose another name.');
      } else {
        return d;
      }
    }
    else {
      if(noconfirm || newRepository) {
        return d;
      } else {
        return retry('Either the repository doesn\'t exists or you don\'t have access to it.');
      }
    }
  }

  function retry(err) {
    Helpers.UI.display(err);
    return promptName()
    .then((answers) => {
      return exec(answers.domain);
    });
  }
  return exec(domain);
}

async function exists(newRepository, base, domain, args, noconfirm) {
  try {
    const exists = await queryExists(base, domain);
    return exists === 'false';
  } catch(err) {
    Helpers.UI.display(`Unable to check if ${domain} exists.`);
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
    const temp = Template.get(templates, templateName);
    if (shell.test('-e', folder)) {
      Helpers.UI.display('Error: folder '+ folder + ' already exists.');
      if(!noconfirm) return requireFolderAndTemplate(templates, domain, null, templateName, noconfirm);
    }
    if (!temp) {
      Helpers.UI.display('Error: invalid template ' + templateName);
      if(!noconfirm) return requireFolderAndTemplate(templates, domain, foldername, null, noconfirm);
    }
    return Promise.resolve(buildAnswers(folder, temp));
  } else if (templateName) {
    return promptFolder(foldername || domain)
    .then((answers) => buildAnswers(answers.folder, Template.get(templates, templateName)));
  } else if (foldername) {
    return promptTemplate(templates, templateName)
    .then((answers) => buildAnswers(foldername, answers.template));
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
