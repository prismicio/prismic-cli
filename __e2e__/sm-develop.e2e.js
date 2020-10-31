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

describe('prismic sm --develop', () => {
  jest.retryTimes(3);
  jest.setTimeout(300000);

  const dir = path.resolve(TMP_DIR, 'sm-develop');
  const repoName = genRepoName('cli-sm-develop');
  
  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => {
      mkdir(dir, { recursive: true });
    });
  });

  it('whole process', async () => {
    const yarn = await lookpath('yarn');
    const newProjoectCmd = `${yarn ? 'yarn create next-app' : 'npx create-next-app'} ${dir} && pushd ${dir} && ${PRISMIC_BIN}`;
    const smJsonPath = path.resolve(dir, 'sm.json');
    const smResolverPath = path.resolve(dir, 'sm-resolver.js');

    spawnSync(newProjoectCmd, ['sm', '--setup', '--domain', repoName], { encoding: 'utf-8', shell: true });

    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(smJsonPath)).toBe(true);
    expect(fs.existsSync(smResolverPath)).toBe(true);

    const sliceDir = 'slices';
    const sliceName = 'MySlice';
  
    const slices = spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--create-slice', '--local-library', sliceDir, '--slice-name', sliceName], { encoding: 'utf8', shell: true });
    
    expect(slices.stderr).toBeFalsy();

    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);

    spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--add-storybook', '--no-start'], { encoding: 'utf8', shell: true });

    expect(fs.existsSync(path.resolve(dir, '.storybook'))).toBe(true);

    const res = spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--develop', '--no-start'], { encoding: 'utf-8', shell: true });
    expect(res.stdout).toBeTruthy();
  });
});
