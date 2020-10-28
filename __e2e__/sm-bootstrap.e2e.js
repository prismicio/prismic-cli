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
  genRepoName,
  mkdir,
} = require('./utils');


describe('prismic sm --bootstrap', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-bootstrap-test');
  const initRepoNamme = genRepoName('cli-sm-bootstrap-new');
  const dir = path.resolve(TMP_DIR, 'sm-bootstrap');

  beforeAll(async () => {
    changeBase();
    login();
    await deleteRepo(repoName);
    return rmdir(dir, { recursive: true }).finally(() => mkdir(TMP_DIR, { recursive: true }));
  });

  it('should setup an existing project for slicemachine', () => {

    const initArgs = [
      'new',
      '--domain', initRepoNamme,
      '--folder', dir,
      '--template', 'NodeJS',
    ];

    spawnSync(PRISMIC_BIN, initArgs, { encoding: 'utf-8', shell: true });

    expect(fs.existsSync(dir)).toBe(true);


    const args = ['sm', '--bootstrap', '--domain', repoName]
    const cmd = `pushd ${dir} && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });
    expect(res.stdout).toBeTruthy();
    const smfile = path.resolve(dir, 'sm.json');
    
    expect(fs.existsSync(smfile)).toBe(true);
    expect(res.status).toBeFalsy();
  })
});
