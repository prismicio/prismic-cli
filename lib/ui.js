'use strict';

var _ = require('lodash');
var inquirer = require('inquirer');

var api = require('./api');
var templates = require('./templates');

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
    return api.exists(base, answers.domain).then(function (exists) {
      if (exists) {
        return inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'This repository already exists. Use it for your project?'
          }
        ]).then(function(answers2) {
          if (answers2.confirm) {
            return answers.domain;
          } else {
            return exports.createRepository(cookies, base, domain);
          }
        });
      } else {
        console.log('Creating repository...');
        return api.createRepository(cookies, base, answers.domain).then(function(domain) {
          console.log('Repository successfully created: ' + subdomain(base, domain));
          return domain;
        });
      }
    });
  });
};

exports.initTemplate = function(domain, foldername) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'folder',
      message: 'Local folder to initalize project: ',
      default: foldername || domain
    },
    {
      type: 'list',
      name: 'template',
      message: 'Technology for your project: ',
      choices: _.map(templates.TEMPLATES, function(template) {
        return {
          name: template.name,
          value: template
        };
      })
    }
  ]).then(function(answers) {
    var folder = answers.folder;
    if (!answers.template.url) {
      throw new Error('Not implemented yet!');
    }
    console.log('Initialize local project...');
    return templates.unzip(answers.template, folder).then(function() {
      templates.replace(folder, [{
        pattern: /your-repo-name/,
        value: domain
      }]);
      return answers;
    });
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

function subdomain(base, domain) {
  var arr = /^(https?:\/\/)(.*)/.exec(base);
  return arr[1] + domain + '.' + arr[2];
}

