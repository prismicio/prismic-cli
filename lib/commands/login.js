import inquirer from 'inquirer';
import Communication from '../services/communication';
import Helpers from '../helpers';
import { setMagicLink } from '../context';
import Sentry from '../services/sentry';

function promptCredentials(email) {
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

export default function signinWithCredentials(base, email, password) {
  return new Promise((resolve) => {
    function run() {
      const answersP = (email && password) ? Promise.resolve({ email, password }) : promptCredentials(email);
      answersP.then((credentials) => {
        const url = `${base}/authentication/signin?ml=true`;
        return Communication.post(url, credentials).then((body) => {
          const parsedToken = Helpers.MagicLink.parse(body);
          if (parsedToken) setMagicLink(parsedToken);
          resolve();
        }).catch((err) => {
          Sentry.report(err, 'prismic-signup');
          Helpers.UI.display(`Login error, check your credentials. If you forgot your password, visit ${base} to reset it.`);
          run();
        });
      });
    }
    run();
  });
}
