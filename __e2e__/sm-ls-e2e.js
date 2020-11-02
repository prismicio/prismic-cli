const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  setup,
  TMP_DIR,
  PRISMIC_BIN,
  rmdir,
  mkdir,
  genRepoName,
  RETRY_TIMES,
} = require('./utils');


describe('prismic sm --ls', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-ls-test');
  const dir = path.resolve(TMP_DIR, 'sm-ls');

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
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
    spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, setupArgs, { encoding: 'utf8', shell: true });
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
