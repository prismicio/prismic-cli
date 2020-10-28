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

describe('prismic init', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-init-test');
  const dir = path.resolve(TMP_DIR, 'init-test');
  const config = path.resolve(dir, 'prismic-configuration.js');

  const args = [
    '--folder', dir,
    '--domain', repoName,
    '--template', 'NodeJS',
    '--noconfirm',
  ];

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    await mkdir(TMP_DIR, { recursive: true });
  });

  beforeEach(async () => rmdir(dir, { recursive: true }));

  it('should initialise a project from a template and create a new repo', () => {
    const res = spawnSync(PRISMIC_BIN, ['init', ...args, '--new'], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(res.status).toBeFalsy();
    expect(fs.existsSync(config)).toBe(true);
  });

  it('should initialise a project from a template with an existing repo', () => {   
    const res = spawnSync(PRISMIC_BIN, ['init', ...args], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(res.status).toBeFalsy();
    expect(fs.existsSync(config)).toBe(true);
  });
});
