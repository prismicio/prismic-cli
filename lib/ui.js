'use strict';

var api = require('./api');
var inquirer = require('inquirer');

exports.signup = function() {
  return inquirer.prompt([
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
  });
};

exports.login = function() {
  return inquirer.prompt([
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
  });
};

exports.signupOrLogin = function() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'login',
      message: 'Do you already have an account on prismic.io?',
      choices: [{
        name: 'Yes, login to my existing account',
        value: 'login'
      }, {
        name: 'No, create a new account',
        value: 'create'
      }]
    }
  ]).then(function(answers) {
    if (answers.login == 'login') {
      return exports.login();
    } else {
      return exports.signup();
    }
  });
};

exports.createRepository = function(cookies, domain) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Domain name: ',
      default: domain
    }
  ]).then(function(answers) {
    console.log("Creating repository...");
    return api.createRepository(answers.domain, cookies);
  });
};

