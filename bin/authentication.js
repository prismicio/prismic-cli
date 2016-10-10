'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _signup = require('./signup');

var _signup2 = _interopRequireDefault(_signup);

var _login = require('./login');

var _login2 = _interopRequireDefault(_login);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { connect: connect };


function connect(base, args) {
  var email = args['--email'];
  var password = args['--password'];
  var noconfirm = args['--noconfirm'] === 'true';
  var cookiesPromise = void 0;
  if (email && password) {
    // The user included login/password, we need to log him with those
    cookiesPromise = (0, _login2.default)(base, email, password).then(function () {
      return _config2.default.get('cookies');
    });
  } else {
    cookiesPromise = _config2.default.get('cookies').then(function (cookies) {
      if (cookies) {
        // The user has cookies saved in his home directory, use this
        return cookies;
      } else {
        if (noconfirm) {
          // Can't proceed non-interactively if we can't login!
          var error = 'Error: to use noconfirm, login first or pass the email/password as options.';
          throw new Error(error);
        }
        // No login/pass, no cookie => need to signin or signup the user before we proceed
        return signupOrLogin(base).then(function () {
          return _config2.default.get('cookies');
        });
      }
    });
  }
  return cookiesPromise;
}

function signupOrLogin(base) {
  return promptSignupOrLogin(base).then(function (answers) {
    if (answers.login == 'login') {
      return (0, _login2.default)(base);
    } else {
      return (0, _signup2.default)(base);
    }
  });
}

function promptSignupOrLogin(base) {
  return _inquirer2.default.prompt([{
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
  }]);
}