import inquirer from 'inquirer';
import Communication from './communication';
import Helpers from './helpers';

function query(base, email, password) {
  const url = `${base}/authentication/signin`;
  const data = {
    email,
    password,
  };
  return Communication.post(url, data);
}

function prompt(email) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email: ',
      default: email,
      validate(mail) {
        return mail && mail.length > 0;
      },
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password: ',
    },
  ]);
}

function exec(base, email, password) {
  return new Promise((resolve) => {
    function run() {
      const answersP = (email && password) ? Promise.resolve({ email, password }) : prompt(email);
      answersP.then((answers) => {
        query(base, answers.email, answers.password)
        .then(() => resolve())
        .catch(() => {
          Helpers.UI.display(`Login error, check your credentials. If you forgot your password, visit ${base} to reset it.`);
          run();
        });
      });
    }
    run();
  });
}

export default exec;
