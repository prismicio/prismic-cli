import Communication, { Domain } from './communication'
import Helpers from './helpers'
import inquirer from 'inquirer'

function exec(base, email, password) {
  return new Promise((resolve) => {
    function run() {
      const answersP = (email && password) ? Promise.resolve({email, password}) : prompt(email)
      answersP.then((answers) => {
        query(base, answers.email, answers.password)
        .then(() => resolve())
        .catch(() => {
          Helpers.UI.display('Login error, check your credentials. If you forgot your password, visit ' + base + ' to reset it.')
          run()
        })
      })
    }
    run()
  })
}

function prompt(email) {
  return inquirer.prompt([
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
      message: 'Password: '
    }
  ]);
}

function query(base, email, password) {
  const url = `${base}/login`;
  const data = {
    email: email,
    password: password,
    next: 'reload'
  }
  return Communication.post(url, data);
}

export default exec
