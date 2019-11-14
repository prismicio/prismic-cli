import inquirer from 'inquirer';
import Communication from './communication';
import Helpers from './helpers';
import config from './config';

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
          if (parsedToken) config.set({ magicLink: parsedToken });
          resolve();
        }).catch(() => {
          Helpers.UI.display(`Login error, check your credentials. If you forgot your password, visit ${base} to reset it.`);
          run();
        });
      });
    }
    run();
  });
}