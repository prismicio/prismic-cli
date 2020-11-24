const os = require('os');
const path = require('path');
const { readFileSync } = require('fs');
const { spawnSync } = require('child_process');
const { PRISMIC_BIN, changeBase } = require('./utils');

describe('prismic base', () => {
  it('should set the base address for prismic', () => {
    const address = process.env.PRISMIC_BASE || 'https://prismic.io'
    const args = ['base', '--base-url', address];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true, stdio: 'inherit' });

    const configPath = path.resolve(os.homedir(), '.prismic');
    const configFile = readFileSync(configPath, 'utf-8');
    const { base } = JSON.parse(configFile);

    expect(base).toBe(address);
  });
});
