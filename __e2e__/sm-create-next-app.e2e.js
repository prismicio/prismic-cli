const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { lookpath } = require('lookpath');
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

describe('create next app', () => {
  jest.retryTimes(3);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-next-app-setup');
  const dir = path.resolve(TMP_DIR, 'next-app-test');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('should work with create-next-app', async () => {
    const yarn = await lookpath('yarn');

    const cmd = `${yarn ? 'yarn create next-app' : 'npx create-next-app'} ${dir} && pushd ${dir} && ${PRISMIC_BIN}`;
    const args = ['sm', '--setup', '--domain', repoName];

    const smJsonPath = path.resolve(dir, 'sm.json');
    const smResolverPath = path.resolve(dir, 'sm-resolver.js')

    spawnSync(cmd, args, { encoding: 'utf-8', shell: true });
    expect(fs.existsSync(smJsonPath)).toBe(true);
    expect(fs.existsSync(smResolverPath)).toBe(true);

  })
})