/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { setBase, getBase } = require('../../lib/context');
const signinWithCredentials = require('../../lib/commands/login').default;

const FormData = require('form-data');

const { rmdir, readFile, unlink, mkdir, chmod } = fs.promises;

const { PRISMIC_BIN, CONFIG_PATH, TMP_DIR, RETRY_TIMES } = require('./constants');

function isLogedin() {
  if (fs.existsSync(CONFIG_PATH) === false) return false;

  const conf = fs.readFileSync(CONFIG_PATH, 'utf-8');
  try {
    const { cookies } = JSON.parse(conf);
    return cookies && /X_XSRF=/.test(cookies) && /prismic-auth=/.test(cookies) 
  } catch {
    return false;
  }
}

function genRepoName(repoName) {
  const email = process.env.PRISMIC_EMAIL || '';
  const name = email.slice(0, email.indexOf('@'));
  const sufix = name.replace(/\W/g,'');
  const base = process.env.PRISMIC_BASE ? getDomainName(process.env.PRISMIC_BASE) : 'test'; 
  return `${repoName}-${sufix}-${base}`;;
}

function getDomainName(str) {
  const url = new URL(str);
  const [ domain ] = url.hostname.split('.'); 
  return domain;
}
async function deleteRepo(repoName, retries = 3) {
  if(fs.existsSync(CONFIG_PATH) === false) {
    await changeBase().then(() => login());
  }

  const conf = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const { base, cookies } = JSON.parse(conf);
  if(!cookies) { login(); }
  const { x_xsfr } = JSON.parse(conf).cookies.match(/(?:X_XSRF=)(?<x_xsfr>(\w|-)*)/).groups;

  const addr = new URL(base || process.env.PRISMIC_BASE);

  const formData = new FormData();
  formData.append('confirm', repoName);
  formData.append('password', process.env.PRISMIC_PASSWORD);

  return new Promise((resolve, reject) => {
    formData.submit({
      hostname: `${repoName}.${addr.host}`,
      path: `/app/settings/delete?_=${x_xsfr}`,
      protocol: addr.protocol,
      headers: {
        cookie: cookies,
      },
    }, (err, res) => {
      const { statusCode, statusMessage } = res;
      if (err) return reject(err);
      if(statusCode < 300 || statusCode === 404) return resolve({ statusCode, statusMessage });
      else if(statusCode === 401 && retries) {
        logout();
        login();
        return deleteRepo(repoName, retries - 1);
      } else if(retries === 0) reject({ statusCode, statusMessage });
    });
  });
}

function changeBase() {
  const address = process.env.PRISMIC_BASE || 'https://prismic.io'
  const current = getBase();
  if (address !== current) { setBase(address); }
}

function login(email = process.env.PRISMIC_EMAIL, password = process.env.PRISMIC_PASSWORD, base = process.env.PRISMIC_BASE) {
  if (isLogedin()) {
    return Promise.resolve({ status: 0, stdout: 'Successfully logged in! You can now create repositories.\n', stderr: '' });
  }
  // const args = ['login', '--email', email, '--password', password ];
  // return spawnSync(PRISMIC_BIN, args, { encoding: 'utf-8' });
  return signinWithCredentials(base, email, password);
}

async function logout() {
  if(fs.existsSync(CONFIG_PATH) === false) return Promise.resolve();
  return unlink(CONFIG_PATH);
}

async function setup(repoName) {
  return logout()
    .then(() => Promise.resolve(changeBase()))
    .then(() => Promise.resolve(login()))
    .then(() => deleteRepo(repoName));
}

module.exports = {
  isLogedin,
  genRepoName,
  deleteRepo,
  rmdir,
  mkdir,
  chmod,
  login,
  PRISMIC_BIN,
  TMP_DIR,
  RETRY_TIMES,
  readFile,
  rm: unlink,
  changeBase,
  setup,
};
