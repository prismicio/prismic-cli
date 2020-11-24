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

describe('prismic theme [ --theme-url | --folder | --conf | --template ]', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-theme-test');
  const dir = path.resolve(TMP_DIR, 'theme-test');

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
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

    spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    expect(fs.existsSync(dir)).toBe(true);
  });
});
