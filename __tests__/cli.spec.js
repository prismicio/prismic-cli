/**
 * comands
 *
 * prismic login [ --email | --password | --oauthaccesstoken ]
 * prismic quickstart [--folder | --template | --new]
 * prismic init [ --folder ]
 * prismic new [ --folder ]
 * prismic theme [ --theme-url | --folder | --conf | --template ]
 * prismic logout
 * prismic signup
 * prismic list
 * prismic --version
 * prismic sm --help
 * primsic sm --ls
 * prismic sm --setup [ --no-prismic | --library | --lib | --local-path ]
 * prismic sm --bootstrap
 * prismic sm --create-slice [ --template-path | --framework ]
 * prismic sm --add-storybook [ --framework ]
 * prismic sm --pull
 *
 * [UN-DOCUMENTED]
 * prismic sm --sm-endpoint
 * prismic sm --override
 * prismic sm --yes|| -y || --noconfirm
 * prismic --debug
 * prismic base || --base
 * prismic --users
 * prismic --noconfirm
 * prismic --domain
 * prismic --endpoint
 * prismic --help
 * prismic heroku
 * 
 * */
const npm = require('npm');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { spawnSync } = require('child_process');

const TMP_DIR = path.resolve('__tmp__');
const PRISMIC_BIN = require.resolve('../bin/prismic');

/*
const util = require('util');
const exec = util.promisify(spawn); */

beforeAll(() => {
  const rmdir = promisify(fs.rmdir);
  const mkdir = promisify(fs.mkdir);
  const chmod = promisify(fs.chmod);
  const load = promisify(npm.load);
  const run = promisify(npm.run);

  return rmdir(TMP_DIR, { recursive: true })
    .then(() => mkdir(TMP_DIR))
    .then(() => load())
    .then(() => run('build'))
    .then(() => chmod(PRISMIC_BIN, 0o755));
});

describe('prismic --help', () => {
  test('it should write usage instructions to stdout', async () => {
    const res = spawnSync(PRISMIC_BIN, ['--help'], { encoding: 'utf8' /* ,stdio: 'inherit' */ });
    expect(res.stdout).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    // expect(stderr).toBeNull(); lots of warnings :/
    // expect(res.stderr).toMatchSnapshot();
  });
});

describe('prismic --version', () => {
  it('should print out the current version on the cli', () => {
    const args = ['--version'];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    // eslint-disable-next-line global-require
    const { version } = require('../package.json');
    const str = res.stdout.replace(/\r|\n/g, '');
    expect(str).toBe(version);
    expect(res.stderr).toBeFalsy();
  });
});

describe('prismic list', () => {
  it('should list the avaible templates', () => {
    const { stdout } = spawnSync(PRISMIC_BIN, ['list'], { encoding: 'utf8' });
    expect(stdout.includes('NodeJS')).toBe(true);
    expect(stdout.includes('React')).toBe(true);
    expect(stdout.includes('Angular2')).toBe(true);
    expect(stdout.includes('Vue.js')).toBe(true);
  });
});


describe.skip('prismic login [ --email | --password | --oauthaccesstoken ]', () => {});

/* requires login */
describe.skip('prismic new', () => {
  const dir = path.join(TMP_DIR, 'test-new');
  const repoName = `qwerty-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
  const args = ['new', '--domain', repoName, '--folder', dir, '--template', 'NodeJS'];

  it('should initialise a project from a template', () => {
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true });
    expect(res.stdout).toMatchSnapshot();
    expect(fs.existsSync(dir)).toBeTruthy();
  });
});

/* requires login */
describe.skip('prismic init', () => {
  const dir = path.join(TMP_DIR, 'init-test');
  const repoName = 'qwerty2223445566';
  const args = ['init', '--domain', repoName, '--folder', dir, '--template', 'NodeJS', '--noconfirm'];

  it('should initialise a project from a template', () => {
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true });
    expect(res.stdout).toMatchSnapshot();
    expect(fs.existsSync(dir)).toBeTruthy();
  });
});

/* requires login */
describe.skip('prismic quickstart [--folder | --template | --new]', () => {
  const dir = path.join(TMP_DIR, 'quickstart');
  const randomString = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
  const repoName = `quickstart-test-${randomString}`;
  const args = ['quickstart', '--folder', dir, '--domain', repoName, '--template', 'NodeJS'];

  it('should initialize a project and repository', () => {
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    expect(res.status).toBeFalsy();
    expect(res.stdout).toBeTruthy();
  });
});

/* requires login */
describe.skip('prismic theme [ --theme-url | --folder | --conf | --template ]', () => {
  it('should reate a rpoject using a theme', () => {
    const dir = path.join(TMP_DIR, 'theme-nuxt');
    const randomString = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    const repoName = `theme-test-${randomString}`;
    const args = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', repoName,
      '--folder', dir,
    ];

    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    expect(res.stdout).toBeTruthy();
    expect(fs.existsSync(dir)).toBe(true);
  })
});

describe.skip('prismic slicemachine', () => {
  it('prismic sm --help', () => {});
  it('prismic sm --ls', () => {});
  it('prismic sm --setup [ --no-prismic | --library | --lib | --local-path ]', () => {});
  it('prismic sm --bootstrap', () => {});
  it('prismic sm --create-slice [ --template-path | --framework ]', () => {});
  it('prismic sm --add-storybook [ --framework ]', () => {})
  it('prismic sm --pull', () => {});
});

describe.skip('prismic logout', () => {});
describe.skip('prismic signup', () => {});