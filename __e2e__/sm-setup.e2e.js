const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  login,
  changeBase,
  deleteRepo,
  TMP_DIR,
  PRISMIC_BIN,
  rmdir,
  mkdir,
  genRepoName,
} = require('./utils');


describe('prismic sm --setup [ --no-prismic | --library | --lib | --local-path ]', () => {
  jest.retryTimes(3);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-setup-test');
  const dir = path.resolve(TMP_DIR, 'sm-setup');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('should setup an existing project for slicemachine from a theme', () => {

    const themeArgs = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', repoName,
      '--folder', dir,
      '--no-install',
    ];

    spawnSync(PRISMIC_BIN, themeArgs, { encoding: 'utf8' });
    expect(fs.existsSync(dir)).toBe(true);

    const args = ['sm', '--setup', '--domain', repoName];
    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });
    const smfile = path.resolve(dir, 'sm.json');

    expect(fs.existsSync(smfile)).toBe(true);
    expect(res.stdout).toBeTruthy();
  });
});
