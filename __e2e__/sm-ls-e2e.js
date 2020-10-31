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


describe('prismic sm --ls', () => {
  jest.retryTimes(3);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-ls-test');
  const dir = path.resolve(TMP_DIR, 'sm-ls');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('should list the slices available in a project', () => {

    const themeArgs = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', repoName,
      '--folder', dir,
      '--skip-install',
    ];

    spawnSync(PRISMIC_BIN, themeArgs, { encoding: 'utf8' });
    expect(fs.existsSync(dir)).toBe(true);

    const setupArgs = ['sm', '--setup', '--domain', repoName, '--yes'];
    const setup = spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, setupArgs, { encoding: 'utf8', shell: true });
    const smfile = path.resolve(dir, 'sm.json');
    expect(fs.existsSync(smfile)).toBe(true);

    const args = ['sm', '--ls'];
    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;

    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });
    expect(res.stdout).toBeTruthy();
    expect(res.stderr).toBeFalsy();
    expect(res.status).toBeFalsy();
  });
});
