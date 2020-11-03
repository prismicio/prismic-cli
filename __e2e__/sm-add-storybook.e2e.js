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
  RETRY_TIMES,
} = require('./utils');


describe('prismic sm --add-storybook', () => {
  jest.retryTimes(RETRY_TIMES); 

  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-storybood-test');
  const dirName = 'sm-add-storybook'
  const dir = path.resolve(TMP_DIR, dirName);

  beforeAll(async () => {
    return rmdir(dir, { recursive: true }).then(() => mkdir(TMP_DIR, { recursive: true })).then(() => setup(repoName));
  });

  it('should add storybook to a nuxt project', async () => {

    const themeArgs = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', repoName,
      '--folder', dir,
    ];
   
    const theme = spawnSync(PRISMIC_BIN, themeArgs, { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBe(true);

    spawnSync(`pushd ${dir} && ${PRISMIC_BIN}`, ['sm', '--setup', '--domain', repoName, '--framework', 'nuxt', '--yes'], { encoding: 'utf-8', shell: true });
    const smfile = path.resolve(dir, 'sm.json');
    expect(fs.existsSync(smfile)).toBe(true);

    const sliceDir = 'slices';
    const sliceName = 'MySlice';
    const sliceArgs = [
      'sm',
      '--create-slice',
      '--local-library', sliceDir,
      '--slice-name', sliceName,
      '--framework', 'nuxt',
    ];

    spawnSync(`pushd ${dir} && NUXT_TELEMETRY_DISABLED=1 ${PRISMIC_BIN}`, sliceArgs, { encoding: 'utf8', shell: true });
    const outDir = path.resolve(dir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);

    spawnSync(`pushd ${dir} && npm install --save-dev core-js@3 @babel/runtime-corejs3`, { encoding: 'utf8', shell: true });

    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const args = ['sm', '--add-storybook', '--no-start', '--framework', 'nuxt'];

    const res = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });

    expect(res.stdout).toBeTruthy();
    expect(res.status).toBeFalsy();
    
    expect(fs.existsSync(path.resolve(dir, '.nuxt-storybook'))).toBe(true);
  });
});
