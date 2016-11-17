'use strict';

import Communication from './communication';
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
  Helpers.UI.display(`You can access your backend here: ${Helpers.Domain.repository(base, domain)}`);
  return domain;
}

async function create(templates, base, domain, args, theme) {
  const noconfirm = args['--noconfirm'] === true;
  const newRepository = args['--new'] === true;

  const d = await chooseDomain(newRepository, base, domain, args, noconfirm);
  const folder = await chooseFolder(d, args, noconfirm);
  const template = theme ? theme.template : await chooseTemplate(d, templates, args, noconfirm);
  await readZipAndCreateRepoWithCustomTypes(newRepository, base, d, args, template, folder, theme, noconfirm);
  installAndDisplayInstructions(base, d, template, folder);
}

async function validateTheme(themeURL) {

  async function retry(url, message) {
    if(message) Helpers.UI.display(message);
    const answers = await promptThemeURL(themeURL);
    return validateTheme(answers.url);
  }

  if(!themeURL) return retry();

  try {
    Helpers.UI.display('We are checking the theme integrity');
    const themeData = isValidThemeURL(themeURL);
    if(themeData) {
      const tmpFolder = await Template.unzip(themeData.url);
      const isValidConfig = checkThemeConfig(tmpFolder, themeData.innerFolder);
      if(isValidConfig) {
        return Helpers.Theme.make(themeData.name, themeData.url, themeData.innerFolder, tmpFolder);
      } else {
        return retry(themeURL, 'Invalid theme provided, check your zip file.');
      }
    } else {
      return retry(themeURL, 'Invalid theme provided, check your zip file.');
    }
  } catch(exception) {
    return retry(themeURL, 'Invalid theme provided, check your zip file.');
  }
}

function checkThemeConfig(themeTmpFolder, innerFolder) {
  const tmpInner = path.join(themeTmpFolder, innerFolder || '.');
  return shell.test('-f', path.join(tmpInner, Helpers.Theme.defaultConfigPath));
}

function isGithubRepository(url) {
  function hasExtension(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  const regexp = new RegExp('^https?:\/\/github\\.com\/[\\w\\-\\.]+\/([\\w\\-\\.]+)(\\.git)?$');
  const matches = url.match(regexp);
  if (matches) {
    const name = hasExtension(matches[1], '.git') ? matches[1].substr(0, matches[1].length - 4) : matches[1];
    const repoURL = hasExtension(matches[0], '.git') ? matches[0].substr(0, matches[0].length - 4) : matches[0];
    const zipUrl = `${repoURL}/archive/master.zip`;
    const innerFolder = `${name}-master`;
    return {url: zipUrl, name, innerFolder};
  } else null;
}

function isGithubZip(url) {
  const regexp =  new RegExp('^https:\/\/github\\.com\/[\\w\\-\\.]+\/([\\w\\-\\.]+)(\/([\\w\\-\\.]+))+\/([\\w\\-\\.]+)\.zip$');
  const matches = url.match(regexp);
  if (matches) {
    const innerFolder = `${matches[1]}-${matches[4]}`;
    return {url, name: matches[1], innerFolder};
  } else null;
}

function isZipURL(url) {
  const regexp =  new RegExp('^https?:\/\/(.*?)\/.*\.zip$');
  const matches = url.match(regexp);
  if (matches) return {url, name: matches[1], innerFolder: null};
  else null;

}

function isValidThemeURL(themeURL) {
  return isGithubRepository(themeURL) ||
    isGithubZip(themeURL) ||
    isZipURL(themeURL);
}

async function chooseDomain(newRepository, base, domain, args, noconfirm) {
  if (domain) {
    return isDomainAvailableOrRetry(newRepository, base, domain, args, noconfirm);
  } else if (noconfirm) {
    throw 'The noconfirm options requires the domain option to be set.';
  } else {
    const answers = await promptName();
    return isDomainAvailableOrRetry(newRepository, base, answers.domain, args, noconfirm);
  }
}

async function chooseFolder(domain, args, noconfirm) {
  async function prompt(folder) {
    const answers = await promptFolder(folder);
    return answers.folder;
  }

  const folder = args['--folder'];
  if(folder) {
    if (shell.test('-e', folder)) {
      Helpers.UI.display('Error: folder '+ folder + ' already exists.');
      if(!noconfirm) prompt(folder);
    } else {
      return folder;
    }
  } else {
    return prompt(domain);
  }
}

async function chooseTemplate(domain, templates, args, noconfirm) {
  async function prompt(template) {
    const answers = await promptTemplate(templates, template);
    return answers.template;
  }

  const template = args['--template'];
  if(template) {
    const temp = Template.get(templates, template);
    if (!temp) {
      Helpers.UI.display('Error: invalid template ' + template);
      if(!noconfirm) return prompt();
    } else {
      return temp;
    }
  } else {
    return prompt();
  }
}

async function readZipAndCreateRepoWithCustomTypes(newRepository, base, domain, args, template, folder, theme, noconfirm) {
  const tmpfolder = theme ? theme.tmpFolder : await Template.unzip(template.url);
  const tmpInner = path.join(tmpfolder, template.innerFolder || '.');
  const initTemplate = () => {
    Helpers.UI.display('Initialize local project');
    shell.mv(tmpInner, folder);
    Template.replace(folder, template, [{
      pattern: /https:\/\/your-repo-name\.prismic\.io\/api/,
      value: Helpers.Domain.api(base, domain)
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
    queryValidateCLI(base, domain)
    .catch(e => { return; }); //required to prevent query error uncaught if onboarding not available in the writing room
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
  return null;
}

//new false
//domain doesn't exist

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
      if(newRepository) {
        return d;
      } else {
        return retry('Either the repository doesn\'t exists or you don\'t have access to it.');
      }
    }
  }

  async function retry(err) {
    Helpers.UI.display(err);
    const answers = await promptName();
    return exec(answers.domain);
  }
  return exec(domain);
}

async function exists(newRepository, base, domain, args, noconfirm) {
  try {
    const isAvailable = await queryAvailable(base, domain);
    return isAvailable === 'false';
  } catch(err) {
    Helpers.UI.display(`Unable to check if ${domain} exists.`);
  }
}

function promptName (domain) {
  return inquirer.prompt([{
    type: 'input',
    name: 'domain',
    message: 'Name your prismic repository: ',
    default: domain,
    validate(value) {
      return new RegExp('^[\\-\\w]+$').test(value) ? true : 'Your repository name can only contains alphanumeric characters, underscores or dashes';
    }
  }]);
}

function queryAvailable(base, domain) {
  const url = `${base}/app/dashboard/repositories/${domain}/exists`;
  return Communication.get(url);
}

function queryCreateRepository(base, domain, cookies, customTypes) {
  const url = `${base}/authentication/newrepository`;
  const data = {
    domain: domain,
    plan: 'personal',
    isAnnual: 'false'
  };
  if(customTypes) data['custom-types'] = JSON.stringify(customTypes);
  return Communication.post(url, data, cookies);
}

function queryValidateCLI(base, domain) {
  const baseWithDomain = Helpers.Domain.repository(base, domain);
  const url = `${baseWithDomain}/app/settings/onboarding/cli`;
  return Communication.post(url, {});
}

function promptThemeURL(themeURL) {
  return inquirer.prompt([{
    type: 'input',
    name: 'url',
    message: 'URL of your theme (zip/github): ',
    default: themeURL,
    validate: function(value) {
      return !isValidThemeURL(value) ? 'Invalid URL please try again!' : true;
    }
  }]);
}

function promptFolder(folderName) {
  return inquirer.prompt([{
    type: 'input',
    name: 'folder',
    message: 'Local folder to initalize project: ',
    default: folderName,
    validate: function(value) {
      return (shell.test('-e', value)) ? 'Folder already exists' : true;
    }
  }]);
}

function promptTemplate(templates, templateName) {
  const displayTemplates = Template.getDisplayed(templates);
  return inquirer.prompt([{
    type: 'list',
    name: 'template',
    message: 'Technology for your project: ',
    default: _(displayTemplates).findIndex(function(tmpl) { return tmpl.name === templateName; }),
    choices: _.map(displayTemplates, function(template) {
      return {
        name: template.name,
        value: template
      };
    })
  }]);
}

async function heroku(templates, templateName) {
  var template = Template.get(templates, templateName);
  Helpers.UI.display('Initialize heroku project');
  const answers = template ? {template: Template.get(templates, templateName)} : await promptTemplate(templateName);
  if (!answers.template.url) {
    throw new Error('Not implemented yet!');
  }
  Helpers.UI.display('Initialize local project...');
  await Template.unzip(answers.template);
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
}

export default { create, validateTheme, heroku };
