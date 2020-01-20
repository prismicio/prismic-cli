import inquirer from 'inquirer';
import Signup from './signup';
import Signin from './login';
import { ctx } from '../context';
import Helpers from '../helpers';

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
    return Signin(base);
  }
  return Signup(base);
}

async function connect() {
  let cookiesPromise;

  if (ctx.cookies) {
    cookiesPromise = ctx.cookies;
  } else if (ctx.email && ctx.password) {
    // The user included login/password, we need to log him with those
    await Signin(ctx.base, ctx.email, ctx.password);
    cookiesPromise = ctx.cookies;
  } else {
    if (ctx.noConfirm) {
      // Can't proceed non-interactively if we can't login!
      Helpers.UI.display('Error: to use noconfirm, login first or pass the email/password as options.');
      cookiesPromise = null;
    }
    // No login/pass, no cookie => need to signin or signup the user before we proceed
    await signupOrLogin(ctx.base);
    cookiesPromise = ctx.cookies;
  }

  return cookiesPromise;
}

export default { connect };
