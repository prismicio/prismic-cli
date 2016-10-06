'use strict';

var _ = require('lodash');
var inquirer = require('inquirer');
var shell = require('shelljs');

var api = require('./api');
var templates = require('./templates');
var configuration = require('./config');

exports.signup = function(base, login, password) {
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
    return api.signup(base, answers.email, answers.password);
  });
};

exports.login = function(base, email, password) {
  var answersP;
  if (email && password) {
    answersP = Promise.resolve({
      email: email,
      password: password
    });
  } else {
    answersP = inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email: ',
        default: email,
        validate: function(email) {
          return email && email.length > 0;
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password: ',
        default: password
      }
    ]);
  }
  return answersP.then(function(answers) {
    return api.login(base, answers.email, answers.password).then(function(success) {
      if (success) {
        return true;
      } else {
        console.log('login error, try again');
        return exports.login(base, answers.email, password);
      }
    });
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

function connectThenCreateRepository(base, domain, args) {
  var email = args['--email'];
  var password = args['--password'];
  var noconfirm = (args['--noconfirm'] === 'true');
  var cookiesPromise;
  if (email && password) {
    // The user included login/password, we need to log him with those
    cookiesPromise = exports.login(base, email, password).then(function() {
      return configuration.get('cookies');
    });
  } else {
    cookiesPromise = configuration.get('cookies').then(function(cookies) {
      if (cookies) {
        // The user has cookies saved in his home directory, use this
        return cookies;
      } else {
        if (noconfirm) {
          // Can't proceed non-interactively if we can't login!
          var error = 'Error: to use noconfirm, login first or pass the email/password as options.';
          console.log(error);
          throw new Error(error);
        }
        // No login/pass, no cookie => need to signin or signup the user before we proceed
        return exports.signupOrLogin(base, args['--email'], args['--password']).then(function() {
          return configuration.get('cookies');
        });
      }
    });
  }
  return cookiesPromise.then(function (cookies) {
    return api.createRepository(cookies, base, domain);
  });
}

exports.askRepositoryName = function(base, domain, args) {
  var noconfirm = (args['--noconfirm'] === 'true');
  var domainPromise;
  if (domain) {
    domainPromise = Promise.resolve({domain: domain});
  } else if (noconfirm) {
    throw 'The noconfirm options requires the domain option to be set.';
  } else {
    domainPromise = inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Domain name: ',
        default: domain
      }
    ]);
  }
  return domainPromise;
};

exports.checkExists = function(base, domain, args) {
  return exports.askRepositoryName(base, domain, args).then(function(answers) {
    return api.exists(base, answers.domain).then(function (exists) {
      if (!exists) {
        throw 'Repository doesn\'t exist.';
      } else {
        return domain;
      }
    });
  });
};

exports.createRepository = function(base, domain, args) {
  return exports.askRepositoryName(base, domain, args).then(function(answers) {
    return answers.domain;
  }).then(function(finalDomain) {
    return api.exists(base, finalDomain);
  }).then(function(exists) {
    if (exists) {
      throw 'Repository already exists.';
    }
    console.log('Creating repository...');
    return connectThenCreateRepository(base, domain, args).then(function(domain) {
      console.log('Repository successfully created: ' + subdomain(base, domain));
      return domain;
    });
  });
};

function folderQuestion(foldername) {
  return {
    type: 'input',
    name: 'folder',
    message: 'Local folder to initalize project: ',
    default: foldername,
    validate: function(value) {
      return (shell.test('-e', value)) ? 'Folder already exists' : true;
    }
  };
}

function templateQuestion(templateName) {
  return {
    type: 'list',
    name: 'template',
    message: 'Technology for your project: ',
    default: _(templates.TEMPLATES).findIndex(function(tmpl) { return tmpl.name === templateName; }),
    choices: _.map(templates.TEMPLATES, function(template) {
      return {
        name: template.name,
        value: template
      };
    })
  };
}

exports.initTemplate = function(domain, foldername, templateName, noconfirm, heroku) {
  var answersPromise, template;
  if (noconfirm || (foldername && templateName)) {
    var folder = foldername || domain;
    template = templateName ? (templates.TEMPLATES.find(function(tmpl) {
      return tmpl.name === templateName;
    })) : templates.TEMPLATES[0];
    if (shell.test('-e', folder)) {
      throw new Error('Error: folder '+ folder + ' already exists.');
    }
    if (!template) {
      throw new Error('Error: invalid template ' + templateName);
    }
    answersPromise = Promise.resolve({
      folder: folder,
      template: template
    });
  } else if (templateName) {
    template = templates.get(templateName);
    answersPromise = new inquirer.prompt([folderQuestion(foldername || domain)]).then(function(answers) {
      answers.template = template;
      return answers;
    });
  } else if (foldername) {
    answersPromise = new inquirer.prompt([templateQuestion(templateName)]).then(function(answers){
      answers.folder = foldername;
      return answers;
    });
  } else {
    answersPromise = new inquirer.prompt([
      folderQuestion(foldername || domain),
      templateQuestion(templateName)
    ]);
  }
  return answersPromise.then(function(answers) {
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

exports.heroku = function(templateName) {
  var answersPromise;
  if (templateName) {
    var template = templates.get(templateName);
    answersPromise = Promise.resolve({
      template: template
    });
  } else {
    answersPromise = new inquirer.prompt([
      templateQuestion(templateName)
    ]);
  }
  return answersPromise.then(function(answers) {
    if (!answers.template.url) {
      throw new Error('Not implemented yet!');
    }
    console.log('Initialize local project...');
    return templates.unzip(answers.template).then(function() {
      templates.replace('.', [{
        pattern: /[\'\"]https:\/\/your-repo-name\.prismic\.io\/api[\'\"]/,
        value: 'process.env.PRISMIC_ENDPOINT'
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
