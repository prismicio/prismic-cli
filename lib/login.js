import Communication, { Domain } from './communication.js';
import inquirer from 'inquirer';

function exec(base, email, password) {
  return new Promise((resolve, reject) => {
    function run() {
      const answersP = (email && password) ? Promise.resolve({email, password}) : prompt(email)
      answersP.then((answers) => {
        query(base, answers.email, answers.password)
        .then(() => resolve())
        .catch(() => run())
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
  };
  return Communication.post(url, data);
}

export default exec
