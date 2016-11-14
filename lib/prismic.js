#!/usr/bin/env node
'use strict';

//Modules dependencies
import Login from './login';
import Signup from './signup';
import Repository from './repository';
import Helpers from './helpers';
import Base from './base';
import { Domain } from './communication';
// TODO:
// - specific runtime instructions from the template, directly on prompt?

import commandLineCommands from 'command-line-commands';
import getUsage from 'command-line-usage';

import pjson from '../package.json';
import configuration from './config';

// === Help

function help(config) {
  console.log(getUsage([
    {
      header: 'Synopsis',
      content: '$ prismic <command> <domain> <options>'
    },
    {
      header: 'Examples',
      content: [
        { name: '$ prismic init', summary: 'Create a project from an existing prismic repository.' },
        { name: '$ prismic new', summary: 'Create a project with a new prismic repository.' },
        { name: '$ prismic init foobar', summary: 'Create a project for the foobar repository' },
        { name: '$ prismic init foobar --folder ~/Desktop/myProject --template NodeJS --noconfirm', summary: 'Create a NodeJS project, non-interactive' }
      ]
    },
    {
      header: 'Command List',
      content: [
        { name: 'init', summary: 'Initialize a project: initialize the code from a template for an existing prismic repository.' },
        { name: 'new', summary: 'Create a project: initialize the code for a new prismic repository.' },
        { name: 'login', summary: 'Login to an existing prismic.io account.' },
        { name: 'logout', summary: 'Logout from an existing prismic.io account.' },
        { name: 'signup', summary: 'Create a new prismic.io account.' },
        { name: 'list', summary: 'List the available code templates.' },
        { name: 'version', summary: 'Print the version.' }
      ]
    },
    {
      header: 'Options',
      optionList: [
        { name: 'email', description: 'The email of the account to use.' },
        { name: 'password', description: 'The password of the account to use.' },
        { name: 'folder', description: 'The folder to create the new project.' },
        { name: 'template', description: 'Project template to use (see the list command for available templates).' },
        { name: 'noconfirm', description: 'Prevent the interactive mode. Fails if informations are missing'},
      ]
    }
  ]));
}

// === Commands

function version() {
  Helpers.UI.display(pjson.version);
}

async function init(config, domain, args) {
  var base = config.base || Domain.Default;
  Helpers.UI.display('Let\'s get to it!');
  try {
    const templates = await Helpers.Prismic.templates();
    Repository.create(templates, base, domain, args);
  } catch(err) {
    Helpers.UI.display(err || 'Repository creation aborted !');
  }
}

  // For testing only
function heroku(config, args) {
  return Helpers.Prismic.templates()
  .then((templates) => Repository.heroku(templates, args['--template']))
  .catch((err) => Helpers.UI.display(err));
}

function signup(config, args) {
  var base = config.base || Domain.Default;
  Signup(base, args['--email'], args['--password'])
  .then(() => Helpers.UI.display('Successfully created your account! You can now create repositories.'));
}

function login(config, args) {
  var base = config.base || Domain.Default;
  Login(base, args['--email'], args['--password'])
  .then(() => Helpers.UI.display('Successfully logged in! You can now create repositories.'));
}

function logout(config, args) {
  configuration.set({cookies: ''}) // clear the cookies
  .then(() => Helpers.UI.display('Successfully logged out !'))
  .catch((err) => console.log(err));
}

function list() {
  Helpers.UI.display('Available templates:');
  return Helpers.Prismic.templates()
  .then((templates) => {
    Helpers.UI.display(templates.map(function(template) {
      return `* ${template.name}`;
    }));
  });
}

// Should only be used by staff, which is why it's not documented
// prismic base http://wroom.dev
function base(base) {
  Base(base)
  .then(function(newBase) {
    Helpers.UI.display(`Successfully changed base ${newBase} !`);
  });
}

// === Main function

function parseArguments(args) {
  const withValueRegex = new RegExp('^--.+$');

  let argts = {};
  let current = null;
  args.forEach(function(value, index) {
    if(value.match(withValueRegex)) {
      argts[value] = true;
      current = value;
    } else {
      argts[current] = value;
    }
  });
  return argts;
}

function main() {
  var validCommands = [ null, 'init', 'new', 'quickstart', 'heroku', 'login', 'logout', 'signup', 'base', 'version', 'list' ];
  var arr = commandLineCommands(validCommands);
  var command = arr.command;
  var firstArg = null;
  if (arr.argv.length > 0 && arr.argv[0].indexOf('--') != 0) {
    firstArg = arr.argv.shift();
  }
  var args = parseArguments(arr.argv);
  configuration.getAll()
  .then(function (config) {
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
      init(config, firstArg, Object.assign(args, {'--new': true}));
      break;
    case 'quickstart':
      Helpers.Prismic.templates()
      .then((templates) => {
        const t = templates.find((t) => t.isQuickstart === true);
        if(t) {
          init(config, firstArg, Object.assign(args, {'--new': true, '--template': t.name}));
        } else {
          Helpers.UI.display('Invalid quickstart template');
        }
      });
      break;
    case 'heroku':
      heroku(config, args);
      break;
    case 'list':
      list();
      break;
    case 'base':
      base(firstArg);
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
} catch(ex) {
  console.log(ex.message);
  help();
}
