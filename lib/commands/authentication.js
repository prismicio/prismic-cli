import inquirer from 'inquirer';
import Signup from './signup';
import Signin from './login';
import { ctx, setCookies } from '../context';
import Helpers from '../helpers';

const request = require('request');

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

function toAuthUrl(path) {
  const base = ctx && ctx.base ? ctx.base : 'https://prismic.io';
  const url = new URL(base);
  url.hostname = `auth.${url.hostname}`;
  url.pathname = path;
  const token = ctx.cookies.split('prismic-auth=')[1].split(';')[0]; // this can go wrong
  url.searchParams.set('token', token);
  return url.toString();
}

async function signupOrLogin(base) {
  const answers = await promptSignupOrLogin(base);
  if (answers.login === 'login') {
    return Signin(base);
  }
  return Signup(base);
}

export async function validate() {
  return new Promise((resolve, reject) => {
    const addr = toAuthUrl('validate');
    return request(addr, (err, response, body) => {
      if (err) { return reject(err); }
      if (+response.statusCode === 200) {
        return resolve(body);
      }
      const e = new Error(response.statusMessage);
      e.response = response;
      return reject(e);
    });
  });
}

export async function refresh() {
  return new Promise((resolve, reject) => {
    const addr = toAuthUrl('refreshtoken');
    return request(addr, (err, response, body) => {
      if (err) { return reject(err); }

      if (+response.statusCode === 200) {
        const newAtuh = `prismic-auth=${body}`;
        setCookies(newAtuh);
        return resolve(body);
      }
      const e = new Error(response.statusMessage);
      e.response = response;
      return reject(e);
    });
  });
}

export async function validateThenRefresh() {
  return validate().then(() => refresh()).catch((e) => {
    if (e.response && e.response.statusCode === 401) return signupOrLogin(ctx.base);
    throw e;
  });
}

async function connect() {
  let cookiesPromise;

  if (ctx.cookies && ctx.cookies.includes('prismic-auth')) {
    cookiesPromise = await validateThenRefresh();
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
