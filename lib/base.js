import config from './config';

import inquirer from 'inquirer';

function exec(newBase) {
  prompt(newBase).then(function(answers) {
    return config.set({
      base: answers.base,
      cookies: '' // clear the cookie because it won't be valid with the new base
    }).then(function() {
      return answers.base;
    });
  }).catch(function(err) {
    console.log('Error: ' , err);
  });
}

function prompt(newBase) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'base',
      message: 'New base domain: (staff only, ex: https://prismic.io )',
      default: newBase
    }
  ]);
}

export default exec
