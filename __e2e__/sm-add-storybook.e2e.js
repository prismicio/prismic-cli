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


describe('prismic sm --add-storybook', () => {

  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-storybood-test');
  const dirName = 'sm-add-storybook'
  const dir = path.resolve(TMP_DIR, dirName);

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('it should add storybook to a nuxt project', () => {
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

    spawnSync(`pushd ${TMP_DIR} && npx create-nuxt-app`, [dirName, '--answers', `'${JSON.stringify(nuxtAnswers)}'`], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBe(true);

    spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--setup', '--domain', repoName], { encoding: 'utf-8', shell: true });
    const smfile = path.resolve(dir, 'sm.json');
    expect(fs.existsSync(smfile)).toBe(true);

    const sliceDir = 'slices';
    const sliceName = 'MySlice';
    const sliceArgs = [
      'sm',
      '--create-slice',
      '--local-library', sliceDir,
      '--slice-name', sliceName,
    ];

    spawnSync(`pushd ${dir} && npx nuxt telemetry disable && ${PRISMIC_BIN}`, sliceArgs, { encoding: 'utf8', shell: true });
    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);

    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const args = ['sm', '--add-storybook', '--no-start'];

    const res = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });

    expect(res.stdout).toBeTruthy();
    expect(res.status).toBeFalsy();
    
    expect(fs.existsSync(path.resolve(dir, '.nuxt-storybook'))).toBe(true);
  });
});
