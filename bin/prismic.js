#!/usr/bin/env node
'use strict';

var pjson = require('../package.json');
var commandLineCommands = require('command-line-commands');
var auth = require('../lib/auth');
var api = require('../lib/api');
var ui = require('../lib/ui');

function help() {
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

function init(argv) {
  var domain = argv[0];
  auth.read().then(function (data) {
    if (data) {
      return data;
    } else {
      return ui.signupOrLogin().then(function() {
        return auth.read();
      });
    }
  }).then(function (cookies) {
    return ui.createRepository(cookies, domain);
  }).then(function (domain) {
    console.log("Repository successfully created: http://" + domain + ".prismic.io");
  }).catch(function(err) {
    console.log("Error: " , err);
  });
}

function signup() {
  ui.signup().then(function(success) {
    if (success) {
      console.log("Successfully created your account! You can now create repositories.");
    } else {
      console.log("Error");
    }
  }).catch(function(err) {
    console.log("Error: " , err);
  });
}

function login() {
  ui.login().then(function(success) {
    if (success) {
      console.log("Successfully logged in! You can now create repositories.");
    } else {
      console.log("Login error, check your credentials. If you forgot your password, visit http://prismic.io to reset it.");
    }
  }).catch(function(err) {
    console.log("Error: " , err);
  });
}

function main() {
  var validCommands = [ null, 'init', 'login', 'signup', 'version' ];
  var { command, argv } = commandLineCommands(validCommands);
  switch (command) {
  case 'login':
    login();
    break;
  case 'signup':
    signup();
    break;
  case 'init':
    init(argv);
    break;
  case 'version':
    version();
    break;
  default:
    help();
  }
}

try {
  main();
} catch(ex) {
  console.log(ex.message);
  help();
}
