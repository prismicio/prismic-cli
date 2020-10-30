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

describe('prismic new', () => {
  jest.setTimeout(300000);

  const dir = path.join(TMP_DIR, 'test-new');
  const repoName = genRepoName('cli-new-test');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => {
      return mkdir(TMP_DIR, { recursive: true });
    });
  });


  it('should create a new project from a template', () => {
    const args = [
      'new',
      '--domain', repoName,
      '--folder', dir,
      '--template',
      'NodeJS',
      '--skip-install',
    ];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true });
    const config = path.resolve(dir, 'prismic-configuration.js');
    expect(fs.existsSync(config)).toBeTruthy();
    // expect(res.stdout).toMatchSnapshot();
    expect(res.status).toBeFalsy();
  });
});
