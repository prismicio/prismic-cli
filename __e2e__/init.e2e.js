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
  jest.retryTimes(3);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-init-test');
  const dir = path.resolve(TMP_DIR, 'init-test');
  const config = path.resolve(dir, 'prismic-configuration.js');

  const args = [
    '--folder', dir,
    '--domain', repoName,
    '--template', 'NodeJS',
    '--noconfirm',
    '--skip-install',
  ];

  beforeAll(async () => {
    changeBase();
    login();
    await rmdir(dir, { recursive: true }).then(() => mkdir(TMP_DIR, { recursive: true }));
    return deleteRepo(repoName);
  });

  it('should initialise a project from a template and create a new repo', async () => {
    const res = spawnSync(PRISMIC_BIN, ['init', ...args, '--new'], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(res.status).toBeFalsy();
    expect(fs.existsSync(config)).toBe(true);

    await rmdir(dir, { recursive: true });

    const reuse = spawnSync(PRISMIC_BIN, ['init', ...args], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(reuse.status).toBeFalsy();
    expect(fs.existsSync(config)).toBe(true);

  });
});
