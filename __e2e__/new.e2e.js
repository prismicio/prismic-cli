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

describe('prismic new', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const dir = path.join(TMP_DIR, 'test-new');
  const repoName = genRepoName('cli-new-test');

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
  });


  it('should create a new project from a template', () => {
    const args = [
      'new',
      '--domain', repoName,
      '--folder', dir,
      '--template', 'NodeJS',
      '--skip-install',
    ];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    const config = path.resolve(dir, 'prismic-configuration.js');
    expect(res.stderr).toBeFalsy();
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(fs.existsSync(config)).toBeTruthy();
    // expect(res.stdout).toMatchSnapshot();
    expect(res.status).toBeFalsy();
  });
});
