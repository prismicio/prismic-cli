#!/usr/bin/env node
'use strict';

// TODO:
// - specific runtime instructions from the template, directly on prompt?

var _ = require('lodash');
var path = require('path');
var shell = require('shelljs');
var commandLineCommands = require('command-line-commands');
var getUsage = require('command-line-usage');

var pjson = require('../package.json');
var configuration = require('../lib/config');
var api = require('../lib/api');
var ui = require('../lib/ui');
var templates = require('../lib/templates');

var DEFAULT_BASE = 'https://prismic.io';
var DEFAULT_BASE_WITH_DOMAIN = function(domain) {
  var matches = DEFAULT_BASE.match(new RegExp('((https?://)([^/]*))'));
  return matches[2] + domain + '.' + matches[3];
};

var isWin = /^win/.test(process.platform);

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
  console.log('Initialize project for ' + base);
  return ui.checkExists(base, domain, args).then(function (domain) {
    if (domain) {
      return ui.initTemplate(domain, args['--folder'], args['--template'], noconfirm);
    } else {
      console.log('Init aborded.');
      return null;
    }
  }).then(function(answers) {
    if (answers && answers.folder) {
      api.onboardingValidateCLI(DEFAULT_BASE_WITH_DOMAIN(domain), domain);
      console.log('Running npm install...');
      var devnull = isWin ? 'NUL' : '/dev/null';
      shell.cd(answers.folder);
      shell.exec('npm install > ' + devnull);
      console.log('Go to the project folder : cd ' + answers.folder);
      if(answers.template.instructions) {
        answers.template.instructions();
      }
    }
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

// For testing only
function heroku(config, args) {
  console.log('Initialize heroku project');
  ui.heroku(args['--template']).then(function(answers) {
    console.log('Running npm install...');
    var devnull = isWin ? 'NUL' : '/dev/null';
    shell.exec('npm install > ' + devnull);
    console.log('Your project in ready! Next steps:');
    console.log(' => Open your writing room: \'heroku addons:docs prismic\'');
    console.log(' => Create the custom types as described in the docs: \'heroku addons:docs prismic\'');
    console.log(' => Run the project: \'heroku local\'');
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function create(config, domain, args) {
  var base = config.base || DEFAULT_BASE;
  var noconfirm = (args['--noconfirm'] === 'true');
  var folder, finalDomain;
  console.log('Initialize project for ' + base);
  return ui.checkNotExists(base, domain, args).then(function (domain) {
    var finalDomain = domain;
    return ui.connect(base, finalDomain, args);
  }).then(function(cookies) {
    if (finalDomain) {
      return ui.initTemplate(finalDomain, args['--folder'], args['--template'], noconfirm);
    } else {
      console.log('Init aborded.');
      return null;
    }
  }).then(function(answers) {
    var customTypes = {};
    if (answers && answers.folder) {
      folder = answers.folder;
      var customTypesPath = path.join(folder, 'customtypes.json');
      if (shell.test('-e', customTypesPath)) {
        customTypes = JSON.stringify(JSON.parse(shell.cat(customTypesPath)));
      }
    }
    return ui.createRepository(base, finalDomain, customTypes, args);
  }).then(function() {
    if (folder) {
      var devnull = isWin ? 'NUL' : '/dev/null';
      shell.cd(folder);
      shell.exec('npm install > ' + devnull);
      console.log('Your project in ready! Go to the ' + folder + ' folder and follow the instructions in the README.');
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
// prismic base http://wroom.dev
function base(base) {
  ui.base(base).then(function(answers) {
    return configuration.set({
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
  var validCommands = [ null, 'init', 'heroku', 'new', 'login', 'signup', 'base', 'version', 'list' ];
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
    case 'signup':
      signup(config, args);
      break;
    case 'init':
      init(config, firstArg, args);
      break;
    case 'heroku':
      heroku(config, args);
      break;
    case 'new':
      create(config, firstArg, args);
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
