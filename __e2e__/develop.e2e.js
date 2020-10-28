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

describe('prismic sm --develop', () => {
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

  it('whole process', () => {
    const newProjoectCmd = `npx create-next-app ${dir} && pushd ${dir} && ${PRISMIC_BIN}`;
    const smJsonPath = path.resolve(dir, 'sm.json');
    const smResolverPath = path.resolve(dir, 'sm-resolver.js');

    spawnSync(newProjoectCmd, ['sm', '--setup', '--domain', repoName], { encoding: 'utf-8', shell: true });

    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(smJsonPath)).toBe(true);
    expect(fs.existsSync(smResolverPath)).toBe(true);

    const sliceDir = 'slices';
    const sliceName = 'MySlice';
  
    spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--create-slice', '--local-library', sliceDir, '--slice-name', sliceName], { encoding: 'utf8', shell: true })

    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);

    spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--add-storybook', '--no-start'], { encoding: 'utf8', shell: true });

    expect(fs.existsSync(path.resolve(dir, '.storybook'))).toBe(true);

    const args = ['sm', '--develop', '--no-start'];
    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });
    expect(res.status).toBeFalsy();
    expect(res.error).toBeFalsy();
  });
});