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


describe('prismic quickstart [--folder | --template | --new]', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-quickstart-test');
  const dir = path.join(TMP_DIR, 'quickstart');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
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
    
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    // expect(res.stdout).toMatchSnapshot();
    expect(fs.existsSync(dir)).toBe(true);
    expect(res.status).toBeFalsy();

  });
});
