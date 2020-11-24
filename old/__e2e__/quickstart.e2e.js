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


describe('prismic quickstart [--folder | --template | --new]', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-quickstart-test');
  const dir = path.join(TMP_DIR, 'quickstart');

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
  });


  const args = [
    'quickstart',
    '--folder', dir,
    '--domain', repoName,
    '--template', 'NodeJS',
    '--noconfirm',
    '--skip-install',
  ];

  it('should initialize a project and repository', () => {
    
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    // expect(res.stdout).toMatchSnapshot();
    expect(fs.existsSync(dir)).toBe(true);
    expect(res.status).toBeFalsy();

  });
});
