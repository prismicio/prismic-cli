import inquirer from 'inquirer';
import Communication from '../services/communication';
import Helpers from '../helpers';
import { setMagicLink } from '../context';
import Sentry from '../services/sentry';

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
  const url = `${base}/authentication/signup?ml=true`;
  const data = {
    email,
    password,
  };
  return Communication.postForm(url, data).then((body) => {
    const parsedToken = Helpers.MagicLink.parse(body);
    if (parsedToken) setMagicLink(parsedToken);
  });
}

function exec(base) {
  return new Promise((resolve) => {
    function run() {
      return prompt().then((answers) => {
        query(base, answers.email, answers.password)
          .then(() => resolve())
          .catch((err) => {
            if (err) {
              Sentry.report(err);
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
