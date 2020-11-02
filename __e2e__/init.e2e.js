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
    '--yes',
  ];

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
  });

  it('should initialise a project from a template and create a new repo', async () => {
    const newRepo = spawnSync(PRISMIC_BIN, ['new', ...args], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(newRepo.status).toBeFalsy();
    expect(fs.existsSync(config)).toBe(true);

    await rmdir(dir, { recursive: true });

    const reuse = spawnSync(PRISMIC_BIN, ['init', ...args], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(reuse.status).toBeFalsy();
    expect(fs.existsSync(config)).toBe(true);

  });
});
