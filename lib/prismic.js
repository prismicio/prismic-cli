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

import _ from 'lodash';
import shell from 'shelljs';
import commandLineCommands from 'command-line-commands';
import getUsage from 'command-line-usage';

import pjson from '../package.json';
import configuration from './config';

var templates = require('./templates');

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
        { name: '$ prismic init foobar', summary: 'Create a project for the foobar repository' },
        { name: '$ prismic new foobar', summary: 'Create the foobar repository then initialize the project (fails if already exists).' },
        { name: '$ prismic init foobar --template NodeJS --noconfirm', summary: 'Create a NodeJS project, non-interactive' }
      ]
    },
    {
      header: 'Command List',
      content: [
        { name: 'init', summary: 'Create a project: initialize the code from a template for an existing repository.' },
        { name: 'new', summary: 'Create the repository initialize the code from a template.' },
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
        { name: 'noconfirm', description: 'Set to "true" to always use the default answer without asking. Fails if information is missing.'}
      ]
    }
  ]));
}

// === Commands

function version() {
  Helpers.UI.display(pjson.version);
}

function init(config, domain, args) {
  var base = config.base || Domain.Default;
  const noconfirm = (args['--noconfirm'] === 'true');
  Helpers.UI.display('Initialize project for ' + base);
  return Repository.create(base, domain, args)
  .then(function (template) {
    Helpers.UI.display(`Successfully created your template : ${template.name} !`)
  });
}

// For testing only
function heroku(config, args) {
  console.log('Initialize heroku project');
  // ui.heroku(args['--template']).then(function(answers) {
  //   console.log('Running npm install...');
  //   var devnull = isWin ? 'NUL' : '/dev/null';
  //   shell.exec('npm install > ' + devnull);
  //   console.log('Your project in ready! Next steps:');
  //   console.log(' => Open your writing room: \'heroku addons:docs prismic\'');
  //   console.log(' => Create the custom types as described in the docs: \'heroku addons:docs prismic\'');
  //   console.log(' => Run the project: \'heroku local\'');
  // }).catch(function(err) {
  //   console.log('Error: ' , err);
  // });
}

function signup(config, args) {
  var base = config.base || Domain.Default;
  Signup(base, args['--email'], args['--password'])
  .then(() => Helpers.UI.display('Successfully created your account! You can now create repositories.'))
}

function login(config, args) {
  var base = config.base || Domain.Default;
  Login(base, args['--email'], args['--password'])
  .then(() => Helpers.UI.display('Successfully logged in! You can now create repositories.'))
}

function logout(config, args) {
  configuration.set({cookies: ''}) // clear the cookies
  .then(() => Helpers.UI.display('Successfully logged out !'))
  .catch((err) => console.log(err))
}

function list() {
  Helpers.UI.display('Available templates:');
  Helpers.UI.display(templates.TEMPLATES.map(function(template) {
    return `* ${template.name}`;
  }));
}

// Should only be used by staff, which is why it's not documented
// prismic base http://wroom.dev
function base(base) {
  Base(base).then(function(newBase) {
    Helpers.UI.display(`Successfully changed base ${newBase} !`);
  });
}

// === Main function

function parseArguments(args) {
  return _(args).chunk(2).reduce(function(result, value) {
    result[value[0]] = value[1];
    return result;
  }, {});
}

function main() {
  var validCommands = [ null, 'init', 'heroku', 'login', 'logout', 'signup', 'base', 'version', 'list' ];
  var arr = commandLineCommands(validCommands);
  var command = arr.command;
  var firstArg = null;
  if (arr.argv.length > 0 && arr.argv[0].indexOf('--') != 0) {
    firstArg = arr.argv.shift();
  }
  var args = parseArguments(arr.argv);
  configuration.getAll().then(function (config) {
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
