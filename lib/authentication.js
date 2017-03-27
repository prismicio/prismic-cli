import inquirer from 'inquirer';
import Signup from './signup';
import Login from './login';
import config from './config';
import Helpers from './helpers';

function promptSignupOrLogin(base) {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'login',
      message: `Do you already have an account on ${base}?`,
      choices: [{
        name: 'Yes, login to my existing account',
        value: 'login',
      }, {
        name: 'No, create a new account',
        value: 'create',
      }],
    },
  ]);
}

async function signupOrLogin(base) {
  const answers = await promptSignupOrLogin(base);
  if (answers.login === 'login') {
    return Login(base);
  }
  return Signup(base);
}

async function connect(base, args, noconfirm) {
  const email = args['--email'];
  const password = args['--password'];
  let cookiesPromise;


  if (email && password) {
    // The user included login/password, we need to log him with those
    await Login(base, email, password);
    cookiesPromise = config.get('cookies');
  } else {
    const cookies = await config.get('cookies');
    if (cookies) {
      // The user has cookies saved in his home directory, use this
      cookiesPromise = cookies;
    } else {
      if (noconfirm) {
        // Can't proceed non-interactively if we can't login!
        Helpers.UI.display('Error: to use noconfirm, login first or pass the email/password as options.');
        cookiesPromise = null;
      }
      // No login/pass, no cookie => need to signin or signup the user before we proceed
      await signupOrLogin(base);
      cookiesPromise = config.get('cookies');
    }
  }
  return cookiesPromise;
}

export default { connect };
