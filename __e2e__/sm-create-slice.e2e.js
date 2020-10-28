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


describe('prismic sm --create-slice [ --local-library | --slice-name ]', () => {

  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-create-slice-test');
  const dirName = 'sm-create-slice'
  const dir = path.resolve(TMP_DIR, dirName);

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('should create a new loccal slice', () => {
    const nuxtAnswers = {
      name: dirName,
      language: 'JavaScript',
      pm: 'Npm',
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
    const initCmd = `pushd ${TMP_DIR} && npx create-nuxt-app`
    spawnSync(initCmd, [dirName, '--answers', `'${JSON.stringify(nuxtAnswers)}'`], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBe(true);

    const setupCmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    spawnSync(setupCmd, ['sm', '--setup', '--domain', repoName], { encoding: 'utf-8', shell: true });
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

    const cmd = `pushd ${dir} && npx nuxt telemetry disable && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });

    expect(res.stderr).toBeFalsy();
    expect(res.stdout).toBeTruthy();

    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);
    expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toMatchSnapshot();
    expect(res.status).toBeFalsy();
  });
});
