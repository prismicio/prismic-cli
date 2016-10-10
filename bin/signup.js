'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _communication = require('./communication');

var _communication2 = _interopRequireDefault(_communication);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function exec(base, email, password) {
  return new Promise(function (resolve) {
    function run() {
      return prompt().then(function (answers) {
        query(base, answers.email, answers.password).then(function () {
          return resolve();
        }).catch(function (err) {
          if (err) {
            var errors = JSON.parse(err).errors;
            _helpers2.default.UI.displayErrors(errors);
          }
          run();
        });
      });
    }
    return run();
  });
}

function prompt() {
  return _inquirer2.default.prompt([{
    type: 'input',
    name: 'email',
    message: 'Email: ',
    validate: function validate(email) {
      return email && email.length > 0;
    }
  }, {
    'type': 'password',
    'name': 'password',
    'message': 'Password: '
  }]);
}

function query(base, email, password) {
  var url = base + '/signup';
  var data = {
    firstname: email.split('@')[0],
    lastname: email.split('@')[0],
    email: email,
    password: password,
    accept: 'true'
  };
  return _communication2.default.post(url, data);
}

exports.default = exec;