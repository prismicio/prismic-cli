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


describe('prismic sm --create-slice [ --local-library | --slice-name ]', () => {
  jest.retryTimes(RETRY_TIMES);
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-create-slice-test');
  const dirName = 'sm-create-slice';
  const dir = path.resolve(TMP_DIR, dirName);

  beforeAll(async () => {
    return rmdir(dir, { recursive: true })
    .then(() => mkdir(TMP_DIR, { recursive: true }))
    .then(() => setup(repoName));
  });


  it('should create a new loccal slice', async () => {
    const yarn = await lookpath('yarn');

    const nuxtAnswers = {
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
    
    const initCmd = `pushd ${TMP_DIR} && ${yarn ? 'yarn create next-app' : 'npx create-next-app'}`;
    
    spawnSync(initCmd, [dirName, '--answers', `'${JSON.stringify(nuxtAnswers)}'`], { encoding: 'utf8', shell: true, stdio: 'inherit' });

    expect(fs.existsSync(dir)).toBe(true);

    const setupCmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    
    spawnSync(setupCmd, ['sm', '--setup', '--domain', repoName, '--yes'], { encoding: 'utf8', shell: true, stdio: 'inherit' });

    const smfile = path.resolve(dir, 'sm.json');

    expect(fs.existsSync(smfile)).toBe(true);

    const sliceDir = 'slices';
    const sliceName = 'MySlice';
    const args = [
      'sm',
      '--create-slice',
      '--local-library', sliceDir,
      '--slice-name', sliceName,
    ];

    const cmd = `pushd ${dir} && NUXT_TELEMETRY_DISABLED=1 ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });

    expect(res.stdout).toBeTruthy();
    expect(res.stderr).toBeFalsy();

    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);
  });
});
