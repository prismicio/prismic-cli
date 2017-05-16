import inquirer from 'inquirer';
import Communication from './communication';
import Helpers from './helpers';

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

function promptOAuth2() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'service',
      message: 'OAuth Service: ',
    },
    {
      type: 'input',
      name: 'token',
      message: 'OAuth access token: ',
    },
  ]);
}

export function signinWithCredentials(base, email, password) {
  return new Promise((resolve) => {
    function run() {
      const answersP = (email && password) ? Promise.resolve({ email, password }) : promptCredentials(email);
      answersP.then((credentials) => {
        const url = `${base}/authentication/signin`;
        return Communication.post(url, credentials).then(() => resolve()).catch(() => {
          Helpers.UI.display(`Login error, check your credentials. If you forgot your password, visit ${base} to reset it.`);
          run();
        });
      });
    }
    run();
  });
}

export function signinWithOAuth(base, service, token) {
  return new Promise((resolve) => {
    function run(oauth2P) {
      oauth2P.then((oauth2) => {
        const url = `${base}/oauth2/${oauth2.service}/signin`;
        return Communication.post(url, { token: oauth2.token }).then(() => resolve()).catch(() => {
          Helpers.UI.display('Login error, check the service name and/or your access token.');
          run(promptOAuth2());
        });
      });
    }
    const oauth2P = token ? Promise.resolve({ service, token }) : promptOAuth2();
    run(oauth2P);
  });
}
