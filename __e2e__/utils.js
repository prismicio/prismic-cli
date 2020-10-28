/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { spawnSync } = require('child_process');

const npm = require('npm');
const FormData = require('form-data');

const { rmdir, readFile, unlink, mkdir, chmod } = fs.promises;

const load = promisify(npm.load);
const run = promisify(npm.run);

const PRISMIC_BIN = require.resolve('../bin/prismic');

const CONFIG_PATH = path.resolve(os.homedir(), '.prismic');

const TMP_DIR = path.resolve('__tmp__');

function isLogedin() {
  if (fs.existsSync(CONFIG_PATH) === false) return false;

  const conf = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const { cookies } = JSON.parse(conf);
  return cookies && /X_XSRF=/.test(cookies) && /prismic-auth=/.test(cookies) 
}

function genRepoName(repoName) {
  const email = process.env.PRISMIC_EMAIL || '';
  const name = email.slice(0, email.indexOf('@'));
  const sufix = name.replace(/\W/g,'');
  return `${repoName}-${sufix}`;
}

async function deleteRepo(repoName) {
  const confPath = path.resolve(os.homedir(), '.prismic');

  const conf = fs.readFileSync(confPath, 'utf-8');
  const { base, cookies } = JSON.parse(conf);
  const { x_xsfr } = cookies.match(/(?:X_XSRF=)(?<x_xsfr>(\w|-)*)/).groups;

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
      return resolve({ statusCode, statusMessage });
    });
  });
}

function changeBase() {
  const address = process.env.PRISMIC_BASE || 'https://prismic.io'
  const args = ['base', '--base-url', address];
  return spawnSync(PRISMIC_BIN, args, { encoding: 'utf-8' });
}

function login(email = process.env.PRISMIC_EMAIL, password = process.env.PRISMIC_PASSWORD) {
  if (isLogedin()) {
    return { status: 0, stdout: 'Successfully logged in! You can now create repositories.\n', stderr: '' };
  }

  const args = ['login', '--email', email, '--password', password ];
  return spawnSync(PRISMIC_BIN, args, { encoding: 'utf-8' });
}

function setup() {
  /* use to set base and login */
  changeBase();
  return login();
}

module.exports = {
  isLogedin,
  genRepoName,
  deleteRepo,
  rmdir,
  mkdir,
  chmod,
  load,
  run,
  login,
  PRISMIC_BIN,
  TMP_DIR,
  readFile,
  rm: unlink,
  changeBase,
  setup,
};
