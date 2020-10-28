
const { spawnSync } = require('child_process');
const { PRISMIC_BIN } = require('./utils');

describe('prismic sm --help', () => {
  it('should write instuctions to stdout', () => {
    const args = ['sm', '--help'];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    expect(res.stdout).toBeTruthy();
    expect(res.stderr).toBeFalsy();
    expect(res.stdout).toMatchSnapshot();
  });
});
