'use strict';

var api = require('./api');
var inquirer = require('inquirer');

exports.signup = function(base) {
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
    return api.signup(base, answers.firstname, answers.lastname, answers.email, answers.password, answers.accept.length > 0);
  });
};

exports.login = function(base) {
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
    return api.login(base, answers.email, answers.password);
  });
};

exports.signupOrLogin = function(base) {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'login',
      message: 'Do you already have an account on ' + base + '?',
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
      return exports.login(base);
    } else {
      return exports.signup(base);
    }
  });
};

exports.createRepository = function(cookies, base, domain) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Domain name: ',
      default: domain
    }
  ]).then(function(answers) {
    console.log('Creating repository...');
    return api.createRepository(cookies, base, answers.domain);
  });
};

exports.base = function(newBase) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'base',
      message: 'New base domain: (staff only, ex: https://prismic.io )',
      default: newBase
    }
  ]);
};

