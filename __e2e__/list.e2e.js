const { spawnSync } = require('child_process');
const { PRISMIC_BIN } = require('./utils');

describe('prismic list', () => {
  it('should list the available templates', () => {
    const { stdout, stderr } = spawnSync(PRISMIC_BIN, ['list'], { encoding: 'utf8', shell: true, stdio: 'inherit' });
    expect(stdout.includes('NodeJS')).toBe(true);
    expect(stdout.includes('React')).toBe(true);
    expect(stdout.includes('Angular2')).toBe(true);
    expect(stdout.includes('Vue.js')).toBe(true);
    expect(stderr).toBeFalsy();
  });
});
