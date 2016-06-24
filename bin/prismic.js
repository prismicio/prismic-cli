#!/usr/bin/env node
'use strict';

var pjson = require('../package.json');
var commandLineCommands = require('command-line-commands');
var inquirer = require('inquirer');
var api = require('../lib/api');

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

function init() {
  console.log("TODO: init");
}

function signup() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'firstname',
      message: 'First name: '
    },
    {
      type: 'input',
      name: 'lastname',
      message: 'Last name: '
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email: ',
      validate: function(email) {
        return email && email.length > 0;
      }
    },
    {
      'type': 'password',
      'name': 'password',
      'message': 'Password: '
    },
    {
      'type': 'checkbox',
      'name': 'accept',
      'message': 'Terms of service: https://prismic.io/legal/terms',
      'choices': ['I agree']
    }
  ]).then(function(answers) {
    return api.signup(answers.firstname, answers.lastname, answers.email, answers.password, answers.accept.length > 0);
  }).then(function(success) {
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
  inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email: ',
      validate: function(email) {
        return email && email.length > 0;
      }
    },
    {
      'type': 'password',
      'name': 'password',
      'message': 'Password: '
    }
  ]).then(function(answers) {
    return api.login(answers.email, answers.password);
  }).then(function(success) {
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
    init();
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
