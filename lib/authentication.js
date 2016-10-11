'use strict';

import Signup from './signup';
import Login from './login';
import config from './config';
import inquirer from 'inquirer';

export default { connect };

function connect(base, args) {
  const email = args['--email'];
  const password = args['--password'];
  const noconfirm = (args['--noconfirm'] === 'true');
  let cookiesPromise;
  if (email && password) {
    // The user included login/password, we need to log him with those
    cookiesPromise = Login(base, email, password).then(function() {
      return config.get('cookies');
    });
  } else {
    cookiesPromise = config.get('cookies')
    .then(function(cookies) {
      if (cookies) {
        // The user has cookies saved in his home directory, use this
        return cookies;
      } else {
        if (noconfirm) {
          // Can't proceed non-interactively if we can't login!
          const error = 'Error: to use noconfirm, login first or pass the email/password as options.';
          throw new Error(error);
        }
        // No login/pass, no cookie => need to signin or signup the user before we proceed
        return signupOrLogin(base).then(function() {
          return config.get('cookies');
        });
      }
    });
  }
  return cookiesPromise;
}

function signupOrLogin(base) {
  return promptSignupOrLogin(base).then(function(answers) {
    if (answers.login == 'login') {
      return Login(base);
    } else {
      return Signup(base);
    }
  });
}

function promptSignupOrLogin(base) {
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
  ]);
}
