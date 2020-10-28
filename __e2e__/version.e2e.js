const { spawnSync } = require('child_process');
const { PRISMIC_BIN } = require('./utils');

describe('prismic --version', () => {
  it('should print out the current version on the cli', () => {
    const args = ['--version'];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    // eslint-disable-next-line global-require
    const { version } = require('../package.json');
    const str = res.stdout.replace(/\r|\n/g, '');
    expect(str).toBe(version);
    expect(res.stderr).toBeFalsy();
  });
});