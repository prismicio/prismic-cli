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
  genRepoName,
  mkdir,
  RETRY_TIMES,
} = require('./utils');


describe('prismic sm --bootstrap', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-bootstrap-test');
  const initRepoNamme = genRepoName('cli-sm-bootstrap-theme');
  const dir = path.resolve(TMP_DIR, 'sm-bootstrap');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    await deleteRepo(initRepoNamme);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('should setup an existing project for slicemachine', () => {

    const initArgs = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', initRepoNamme,
      '--folder', dir,
      '--skip-install',
    ];

    const theme = spawnSync(PRISMIC_BIN, initArgs, { encoding: 'utf-8', shell: true });
    expect(theme.stderr).toBeFalsy();
    expect(fs.existsSync(dir)).toBe(true);

    const args = ['sm', '--bootstrap', '--domain', repoName];
    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const bootstrap = spawnSync(cmd, args, { encoding: 'utf8', shell: true });
    expect(bootstrap.stdout).toBeTruthy();
    const smfile = path.resolve(dir, 'sm.json');
    
    expect(fs.existsSync(smfile)).toBe(true);
    expect(bootstrap.stderr).toBeFalsy();
  });
});
