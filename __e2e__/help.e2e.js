const { spawnSync } = require('child_process');
const { PRISMIC_BIN } = require('./utils');

describe('prismic --help', () => {
  test('it should write usage instructions to stdout', async () => {
    const res = spawnSync(PRISMIC_BIN, ['--help'], { encoding: 'utf8', shell: true });
    expect(res.stdout).toBeTruthy();
    // expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toBeFalsy();
  });
});
