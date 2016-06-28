#!/usr/bin/env node
'use strict';

// TODO:
// - ensure directory doesn't exist yet before creating template
// - non-interactive mode
// - allow setting a foldername from the command line
// - allow choosing a template from the command line
// - command line to list the available templates
// - specific runtime instructions from the template, directly on prompt?

var pjson = require('../package.json');
var commandLineCommands = require('command-line-commands');
var configuration = require('../lib/config');
var ui = require('../lib/ui');

var DEFAULT_BASE = 'https://prismic.io';

function help(config) {
  console.log(config.base || DEFAULT_BASE);
  console.log('Usage: prismic <command>');
  console.log();
  console.log('Valid commands:');
  console.log();
  console.log('   init       Create a project, creating the repository if needed');
  console.log('   login      Login to an existing prismic.io account');
  console.log('   signup     Create a new prismic.io account');
  console.log('   version    Print the current cli version number');
}

function version() {
  console.log('prismic.io version ' + pjson.version);
}

function init(config, argv) {
  var domain = argv[0];
  var cookiesPromise = config.cookies
        ? Promise.resolve(config.cookies)
        : ui.signupOrLogin(config.base || DEFAULT_BASE).then(function() {
          return configuration.get('cookies');
        });
  cookiesPromise.then(function (cookies) {
    var base = config.base || DEFAULT_BASE;
    console.log('Create a project on ' + base);
    return ui.createRepository(cookies, base, domain).then(function (domain) {
      if (domain) {
        return ui.initTemplate(domain);
      } else {
        console.log('Error creating repository.');
        return null;
      }
    });
  }).then(function(answers) {
    console.log('Your project in ready! Go to the ' + answers.folder + ' folder and follow the instructions in the README.');
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function signup(config) {
  ui.signup(config.base || DEFAULT_BASE).then(function(success) {
    if (success) {
      console.log('Successfully created your account! You can now create repositories.');
    } else {
      console.log('Error');
    }
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function login(config) {
  var base = config.base || DEFAULT_BASE;
  return ui.login(base).then(function(success) {
    if (success) {
      console.log('Successfully logged in! You can now create repositories.');
    } else {
      console.log('Login error, check your credentials. If you forgot your password, visit ' + base + ' to reset it.');
    }
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function base(config, argv) {
  ui.base(argv[0]).then(function(answers) {
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

function main() {
  var validCommands = [ null, 'init', 'login', 'signup', 'base', 'version' ];
  var arr = commandLineCommands(validCommands);
  var command = arr.command;
  var argv = arr.argv;
  configuration.getAll().then(function (config) {
    switch (command) {
    case 'login':
      login(config);
      break;
    case 'signup':
      signup(config);
      break;
    case 'init':
      init(config, argv);
      break;
    case 'base':
      // Should only be used by staff, which is why it's not documented
      base(config, argv);
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
