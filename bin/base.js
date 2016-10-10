'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function exec(newBase) {
  prompt(newBase).then(function (answers) {
    return _config2.default.set({
      base: answers.base,
      cookies: '' // clear the cookie because it won't be valid with the new base
    }).then(function () {
      return answers.base;
    });
  }).catch(function (err) {
    console.log('Error: ', err);
  });
}

function prompt(newBase) {
  return _inquirer2.default.prompt([{
    type: 'input',
    name: 'base',
    message: 'New base domain: (staff only, ex: https://prismic.io )',
    default: newBase
  }]);
}

exports.default = exec;