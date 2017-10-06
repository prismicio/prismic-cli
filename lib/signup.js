import inquirer from 'inquirer';
import Communication from './communication';
import Helpers from './helpers';

function prompt() {
  return inquirer.prompt([{
    type: 'input',
    name: 'email',
    message: 'Email: ',
    validate(email) {
      return email && email.length > 0;
    },
  }, {
    type: 'password',
    name: 'password',
    message: 'Password: ',
  }]);
}

function query(base, email, password) {
  const url = `${base}/authentication/signup`;
  const data = {
    email,
    password,
  };
  return Communication.post(url, data);
}

function exec(base) {
  return new Promise((resolve) => {
    function run() {
      return prompt().then((answers) => {
        query(base, answers.email, answers.password)
          .then(() => resolve())
          .catch((err) => {
            if (err) {
              const { errors } = JSON.parse(err);
              Helpers.UI.displayErrors(errors);
            }
            run();
          });
      });
    }
    return run();
  });
}
export default exec;
