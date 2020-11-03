/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process')
const fetch = require('node-fetch').default;
const FormData = require('form-data');
const { rmdir, readFile, unlink, mkdir, chmod, writeFile } = fs.promises;
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
  const randomString = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)
  const base = process.env.PRISMIC_BASE ? getDomainName(process.env.PRISMIC_BASE) : 'test'; 
  return `${repoName}-${sufix}-${base}-${randomString}`;;
}

function getDomainName(str) {
  const url = new URL(str);
  const [ domain ] = url.hostname.split('.'); 
  return domain;
}
async function deleteRepo(repoName, retries = 3) {

  const conf = fs.readFileSync(path.resolve(CONFIG_PATH), 'utf-8');
  const { base, cookies } = JSON.parse(conf);
  const { x_xsfr } = JSON.parse(conf).cookies.match(/(?:X_XSRF=)(?<x_xsfr>(\w|-)*)/).groups;

  const addr = new URL('/app/settings/delete', base || process.env.PRISMIC_BASE);
  addr.hostname = `${repoName}.${addr.hostname}`;
  addr.searchParams.append('_', x_xsfr);

  const formData = new FormData();
  formData.append('confirm', repoName.trim());
  formData.append('password', process.env.PRISMIC_PASSWORD.trim());

  return fetch(addr.toString(), {
    method: 'POST',
    body: formData,
    headers: {
      cookie: cookies,
      userAgent: 'prismic/cli',
    },
  }).then((res) => {
    // if(res.status === 401 && retries) return login().then(() => deleteRepo(repoName, retries - 1));
    // fie (res.status < 400 || res.status === 404) return res; 
    return res;
  });
}

function changeBase() {
  const address = process.env.PRISMIC_BASE || 'https://prismic.io'
  const res = spawnSync(PRISMIC_BIN, ['base', '--base-url', address.trim()]);
  return Promise.resolve(res);
}

function login(email = process.env.PRISMIC_EMAIL, password = process.env.PRISMIC_PASSWORD, base = process.env.PRISMIC_BASE) {
  if (isLogedin()) {
    return Promise.resolve({ status: 0, stdout: 'Successfully logged in! You can now create repositories.\n', stderr: '' });
  }
  const args = ['login', '--email', email, '--password', password ];
  const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf-8' });
  return Promise.resolve(res);
}

async function logout() {
  return writeFile(CONFIG_PATH, JSON.stringify({
    base: "",
    cookies: "",
  }));
}

async function setup(repoName) {
  return logout()
    .then(() => changeBase())
    .then(() => login())
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