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

describe('prismic theme [ --theme-url | --folder | --conf | --template ]', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-theme-test-two');
  const dir = path.resolve(TMP_DIR, 'theme-test');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });


  it('should create a project using a theme', () => {
    const args = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', repoName,
      '--folder', dir,
      '--skip-install',
    ];

    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    expect(res.stdout).toBeTruthy();
    // expect(res.stdout).toMatchSnapshot();

    expect(fs.existsSync(dir)).toBe(true);
    expect(res.status).toBeFalsy();
  });
});
