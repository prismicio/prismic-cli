const os = require('os');
const path = require('path');
const { existsSync, readFileSync } = require('fs');
const { spawnSync } = require('child_process');
const { PRISMIC_BIN, changeBase } = require('./utils');


const PRSIMIC_CONF = path.resolve(os.homedir(), '.prismic');

describe('prismic logout', () => {
  jest.retryTimes(3);
  beforeAll(() => {
    changeBase();
  });

  it('should log the user out', () => {
    const { stdout, status } = spawnSync(PRISMIC_BIN, ['logout'], { encoding: 'utf8'});
    expect(stdout).toMatchSnapshot();
    expect(status).toBeFalsy();

    const configFile = readFileSync(PRSIMIC_CONF, { encoding: 'utf8', shell: true, stdio: 'inherit' })
    const { cookies } = JSON.parse(configFile);
    expect(cookies).toBeDefined();
    expect(cookies).toBeFalsy();
  });
});

describe('prismic login [ --email | --password | --oauthaccesstoken ]', () => {

  it('should log a user in', () => {
    const { PRISMIC_EMAIL, PRISMIC_PASSWORD } = process.env;
    expect(process.env.PRISMIC_EMAIL).toBeDefined();
    expect(process.env.PRISMIC_PASSWORD).toBeDefined();

    const args = ['login', '--email', PRISMIC_EMAIL, '--password', PRISMIC_PASSWORD ];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    expect(res.stdout).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toBeFalsy();
    expect(res.status).toBeFalsy();
    expect(existsSync(PRSIMIC_CONF)).toBe(true);


    const configFile = readFileSync(PRSIMIC_CONF, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    const { cookies } = JSON.parse(configFile);
    expect(cookies).toBeTruthy();
  });
});
