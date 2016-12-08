'use strict';

import Communication from './communication';
import inquirer from 'inquirer';
import Helpers from './helpers';

function exec(base, email, password) {
  return new Promise((resolve) => {
    function run() {
      return prompt()
      .then((answers) => {
        query(base, answers.email, answers.password)
        .then(() => resolve())
        .catch((err) => {
          if(err) {
            const errors = JSON.parse(err).errors;
            Helpers.UI.displayErrors(errors);
          }
          run();
        });
      });
    }
    return run();
  });
}

function prompt() {
  return inquirer.prompt([{
    type: 'input',
    name: 'email',
    message: 'Email: ',
    validate(email) {
      return email && email.length > 0;
    }
  }, {
    'type': 'password',
    'name': 'password',
    'message': 'Password: '
  }]);
}

function query(base, email, password) {
  const url = `${base}/authentication/signup`;
  const data = {
    email: email,
    password: password
  };
  return Communication.post(url, data);
}

export default exec;
