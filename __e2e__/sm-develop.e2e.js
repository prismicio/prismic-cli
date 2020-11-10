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

describe('prismic sm --develop', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const dirName = 'sm-develop';
  const dir = path.resolve(TMP_DIR, dirName);
  const repoName = genRepoName('cli-sm-develop');
  
  beforeAll(async () => rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName)));

  it('whole process', async () => {
    const yarn = await lookpath('yarn');

    const nextAnswers = {
      name: dirName,
      language: 'JavaScript',
      pm: yarn ? 'Yarn' : 'Npm',
      ui: 'None',
      features: [],
      linter: [],
      test: 'none',
      mode: 'universal',
      target: 'server',
      devTools: [],
      ci: 'none',
      vcs: 'none',
    };
    
    const initCmd = `cd ${TMP_DIR} && ${yarn ? 'yarn create next-app' : 'npx create-next-app'}`;
    
    spawnSync(initCmd, [dirName, '--answers', `'${JSON.stringify(nextAnswers)}'`], { encoding: 'utf8', shell: true, stdio: 'inherit' });

    expect(fs.existsSync(dir)).toBe(true);

    const smJsonPath = path.resolve(dir, 'sm.json');
    const smResolverPath = path.resolve(dir, 'sm-resolver.js');

    spawnSync(`cd ${dir} && ${PRISMIC_BIN}`, ['sm', '--setup', '--domain', repoName], { encoding: 'utf8', shell: true, stdio: 'inherit' });

    expect(fs.existsSync(smJsonPath)).toBe(true);
    expect(fs.existsSync(smResolverPath)).toBe(true);

    const sliceDir = 'slices';
    const sliceName = 'MySlice';
    const sliceArgs = [
      'sm',
      '--create-slice',
      '--local-library', sliceDir,
      '--slice-name', sliceName,
    ];
  
    spawnSync(`cd ${dir} && ${PRISMIC_BIN}`, sliceArgs, { encoding: 'utf8', shell: true, stdio: 'inherit' });
    
    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);

    spawnSync(`cd ${dir} && ${PRISMIC_BIN}`, ['sm', '--add-storybook', '--no-start'], { encoding: 'utf8', shell: true, stdio: 'inherit' });

    expect(fs.existsSync(path.resolve(dir, '.storybook'))).toBe(true);

    const res = spawnSync(`cd ${dir} && ${PRISMIC_BIN}`, ['sm', '--develop', '--no-start'], { encoding: 'utf8', shell: true });
    expect(res.stdout).toBeTruthy();
  });
});
