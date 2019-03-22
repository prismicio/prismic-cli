#!/usr/bin/env node

import commandLineCommands from 'command-line-commands';
import getUsage from 'command-line-usage';

import Signin from './login';
import Signup from './signup';
import Repository from './repository';
import Helpers from './helpers';
import Template from './template';
import Base from './base';

// TODO:
// - specific runtime instructions from the template, directly on prompt?

import pjson from '../package.json';
import configuration from './config';

// === Help

function help() {
  console.log(getUsage([
    {
      header: 'Synopsis',
      content: '$ prismic <command> <domain> <options>',
    },
    {
      header: 'Examples',
      content: [
        { name: '$ prismic init', summary: 'Create a project from an existing prismic repository.' },
        { name: '$ prismic new', summary: 'Create a project with a new prismic repository.' },
        { name: '$ prismic init foobar', summary: 'Create a project for the foobar repository' },
        { name: '$ prismic init foobar --folder ~/Desktop/myProject --template NodeJS --noconfirm', summary: 'Create a NodeJS project, non-interactive' },
        { name: '$ prismic theme https://github.com/prismicio/nodejs-sdk', summary: 'Create a project from a zip file with a new prismic repository.' },
      ],
    },
    {
      header: 'Command List',
      content: [
        { name: 'quickstart', summary: 'Create a project: initialize a node.js quickstart project with a new prismic repository.' },
        { name: 'init', summary: 'Initialize a project: initialize the code from a template for an existing prismic repository.' },
        { name: 'new', summary: 'Create a project: initialize the code for a new prismic repository.' },
        { name: 'theme', summary: 'Create a project: initialize project from a theme with a new prismic repository.' },
        { name: 'login', summary: 'Login to an existing prismic.io account.' },
        { name: 'logout', summary: 'Logout from an existing prismic.io account.' },
        { name: 'signup', summary: 'Create a new prismic.io account.' },
        { name: 'list', summary: 'List the available code templates.' },
        { name: 'version', summary: 'Print the version.' },
      ],
    },
    {
      header: 'Options',
      optionList: [
        { name: 'email', description: 'The email of the account to use.' },
        { name: 'password', description: 'The password of the account to use.' },
        { name: 'folder', description: 'The folder to create the new project.' },
        { name: 'template', description: 'Project template to use (see the list command for available templates).' },
        { name: 'noconfirm', description: 'Prevent the interactive mode. Fails if informations are missing.' },
        { name: 'conf', description: 'Specify path to prismic configuration file. Used with `theme` command.' },
        { name: 'ignore-conf', description: 'Ignores prismic configuration file. Used with `theme` command.' },
      ],
    },
  ]));
}

// === Commands

function version() {
  Helpers.UI.display(pjson.version);
}

async function init(config, domain, args, theme) {
  const base = config.base || Helpers.Domain.default;
  if (args['--new'] && Helpers.Domain.default !== base) {
    Helpers.UI.display(`CAREFUL, your current base is: ${base}\n`);
  }

  Helpers.UI.display('Let\'s get to it!');
  const templates = await Helpers.Prismic.templates();
  Repository.create(templates, base, domain, args, theme).catch((err) => {
    Helpers.UI.display(`Repository creation aborted: ${err}`);
  });
}

async function initWithTheme(config, url, args) {
  try {
    const opts = {
      configPath: args['--conf'] || Helpers.Theme.defaultConfigPath,
      ignoreConf: args['--ignore-conf'],
    };

    const theme = await Repository.validateTheme(url, opts);
    return await init(config, null, args, theme);
  } catch (err) {
    return Helpers.UI.display(`Repository creation aborted: ${err}`);
  }
}

// For testing only
async function heroku(config, args) {
  const templates = Helpers.Prismic.templates();
  try {
    Repository.heroku(templates, args['--template']);
  } catch (err) {
    Helpers.UI.display(err);
  }
}

async function signup(config, args) {
  const base = config.base || Helpers.Domain.default;
  await Signup(base, args['--email'], args['--password']);
  Helpers.UI.display('Successfully created your account! You can now create repositories.');
}

async function login(config, args) {
  const base = config.base || Helpers.Domain.default;
  const email = args['--email'];
  const password = args['--password'];
  await Signin(base, email, password);
  Helpers.UI.display('Successfully logged in! You can now create repositories.');
}

async function logout() {
  try {
    await configuration.set({ cookies: '' }); // clear the cookies
    Helpers.UI.display('Successfully logged out !');
  } catch (err) {
    console.log(err);
  }
}

async function list() {
  Helpers.UI.display('Available templates:');
  const templates = await Helpers.Prismic.templates();
  Helpers.UI.display(Template.getDisplayed(templates).map(template => `* ${template.name}`));
}

// Should only be used by staff, which is why it's not documented
// prismic base http://wroom.dev
async function updateBase(base) {
  const newBase = await Base(base);
  Helpers.UI.display(`Successfully changed base ${newBase} !`);
}

// === Main function

function parseArguments(args) {
  const withValueRegex = new RegExp('^--.+$');
  const argts = {};
  let current = null;
  args.forEach((value) => {
    if (value.match(withValueRegex)) {
      argts[value] = true;
      current = value;
    } else {
      argts[current] = value;
    }
  });
  return argts;
}

function main() {
  const validCommands = [null, 'init', 'new', 'theme', 'quickstart', 'heroku', 'login', 'logout', 'signup', 'base', 'version', 'list'];
  const arr = commandLineCommands(validCommands);
  const { command } = arr;
  let firstArg = null;
  if (arr.argv.length > 0 && arr.argv[0].indexOf('--') !== 0) {
    firstArg = arr.argv.shift();
  }
  const args = parseArguments(arr.argv);
  configuration.getAll().then((config) => {
    switch (command) {
      case 'login':
        login(config, args);
        break;
      case 'logout':
        logout(config, args);
        break;
      case 'signup':
        signup(config, args);
        break;
      case 'init':
        init(config, firstArg, args);
        break;
      case 'new':
        init(config, firstArg, Object.assign(args, { '--new': true }));
        break;
      case 'quickstart':
        Helpers.Prismic.templates().then((templates) => {
          const t = templates.find(tmpl => tmpl.isQuickstart === true);
          if (t) {
            init(config, firstArg, Object.assign(args, { '--new': true, '--template': t.name }));
          } else {
            Helpers.UI.display('Invalid quickstart template');
          }
        });
        break;
      case 'theme':
        initWithTheme(config, firstArg, Object.assign(args, { '--new': true }));
        break;
      case 'heroku':
        heroku(config, args);
        break;
      case 'list':
        list();
        break;
      case 'base':
        Helpers.UI.display(`Current base: ${config.base}\n`);
        updateBase(firstArg);
        break;
      case 'version':
        version(config);
        break;
      default:
        help(config);
    }
  });
}

try {
  main();
} catch (ex) {
  console.log(ex.message);
  help();
}
