const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { lookpath } = require('lookpath');
const {
  setup,
  TMP_DIR,
  PRISMIC_BIN,
  rmdir,
  mkdir,
  genRepoName,
  RETRY_TIMES,
} = require('./utils');

describe('create next app', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-next-app-setup');
  const dir = path.resolve(TMP_DIR, 'next-app-test');

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
  });

  it('should work with create-next-app', async () => {
    const yarn = await lookpath('yarn');

    const cmd = `${yarn ? 'yarn create next-app' : 'npx create-next-app'} ${dir} && cd ${dir} && ${PRISMIC_BIN}`;
    const args = ['sm', '--setup', '--domain', repoName, '--framework', 'next', '--yes'];

    const smJsonPath = path.resolve(dir, 'sm.json');
    const smResolverPath = path.resolve(dir, 'sm-resolver.js')

    spawnSync(cmd, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    expect(fs.existsSync(smJsonPath)).toBe(true);
    expect(fs.existsSync(smResolverPath)).toBe(true);

  })
})
