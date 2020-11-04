const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  setup,
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
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName))
    .then(() => setup(initRepoNamme));
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

    const theme = spawnSync(PRISMIC_BIN, initArgs, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    expect(theme.stderr).toBeFalsy();
    expect(fs.existsSync(dir)).toBe(true);

    const args = ['sm', '--bootstrap', '--domain', repoName];
    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const bootstrap = spawnSync(cmd, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    const smfile = path.resolve(dir, 'sm.json');
    
    expect(fs.existsSync(smfile)).toBe(true)
  });
});
