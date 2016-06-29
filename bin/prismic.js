#!/usr/bin/env node
'use strict';

// TODO:
// - specific runtime instructions from the template, directly on prompt?
// - fix error handling on wrong password, and provide multiple tries

var _ = require('lodash');
var shell = require('shelljs');
var commandLineCommands = require('command-line-commands');
var getUsage = require('command-line-usage');

var pjson = require('../package.json');
var configuration = require('../lib/config');
var ui = require('../lib/ui');
var templates = require('../lib/templates');

var DEFAULT_BASE = 'https://prismic.io';

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
        { name: '$ prismic init foobar --template NodeJS --noconfirm', summary: 'Create a NodeJS project, non-interactive' }
      ]
    },
    {
      header: 'Command List',
      content: [
        { name: 'init', summary: 'Create a project: create the repository if needed then initialize the code from a template.' },
        { name: 'login', summary: 'Login to an existing prismic.io account.' },
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
  console.log(pjson.version);
}

function init(config, domain, args) {
  var base = config.base || DEFAULT_BASE;
  var noconfirm = (args['--noconfirm'] === 'true');
  console.log('Create a project on ' + base);
  return ui.createRepository(base, domain, args).then(function (domain) {
    if (domain) {
      return ui.initTemplate(domain, args['--folder'], args['--template'], noconfirm);
    } else {
      console.log('Init aborded.');
      return null;
    }
  }).then(function(answers) {
    if (answers && answers.folder) {
      shell.cd(answers.folder);
      shell.exec('npm install');
      console.log('Your project in ready! Go to the ' + answers.folder + ' folder and follow the instructions in the README.');
    }
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function signup(config, args) {
  ui.signup(config.base || DEFAULT_BASE, args['--email'], args['--password']).then(function(success) {
    if (success) {
      console.log('Successfully created your account! You can now create repositories.');
    } else {
      console.log('Error');
    }
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function login(config, args) {
  var base = config.base || DEFAULT_BASE;
  return ui.login(base, args['--email'], args['--password']).then(function(success) {
    if (success) {
      console.log('Successfully logged in! You can now create repositories.');
    } else {
      console.log('Login error, check your credentials. If you forgot your password, visit ' + base + ' to reset it.');
    }
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function list() {
  console.log('Available templates:');
  templates.TEMPLATES.forEach(function(template) {
    console.log(' * ' + template.name);
  });
}

// Should only be used by staff, which is why it's not documented
function base(config, argv) {
  ui.base(argv['--base']).then(function(answers) {
    return config.set({
      base: answers.base,
      cookies: '' // clear the cookie because it won't be valid with the new base
    }).then(function() {
      console.log('The base domain is now ' + answers.base);
    });
  }).catch(function(err) {
    console.log('Error: ' , err);
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
  var validCommands = [ null, 'init', 'login', 'signup', 'base', 'version', 'list' ];
  var arr = commandLineCommands(validCommands);
  var command = arr.command;
  var domain = null;
  if (arr.argv.length > 0 && arr.argv[0].indexOf('--') != 0) {
    domain = arr.argv.shift();
  }
  var args = parseArguments(arr.argv);
  configuration.getAll().then(function (config) {
    switch (command) {
    case 'login':
      login(config, args);
      break;
    case 'signup':
      signup(config, args);
      break;
    case 'init':
      init(config, domain, args);
      break;
    case 'list':
      list();
      break;
    case 'base':
      base(config, args);
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
