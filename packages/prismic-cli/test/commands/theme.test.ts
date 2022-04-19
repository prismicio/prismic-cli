import {expect, test} from '@oclif/test'
import * as path from 'path'
import * as os from 'os'
import {fs} from '../../src/utils'
import {Theme as ThemeZip, ThemeWithConfig as ThemeWithConfigZip} from '../__stubs__/template'
import Theme from '../../src/commands/theme'
import * as lookpath from 'lookpath'

describe('theme', () => {
  test.it('theme flags', () => {
    expect(Theme.flags.conf).to.exist
    expect(Theme.flags.customTypes).to.exist
    expect(Theme.flags.documents).to.exist
    expect(Theme.flags.domain).to.exist
    expect(Theme.flags.folder).to.exist
    expect(Theme.flags.force).to.exist
    expect(Theme.flags.help).to.exist
    expect(Theme.flags['theme-url']).to.exist
    expect(Theme.flags['skip-install']).to.exist
    expect(Theme.flags['existing-repo']).to.exist
  })

  const fakeDomain = 'fake-theme-domain'
  const fakeBase = 'https://prismic.io'
  const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'
  const tmpDir = os.tmpdir()
  const testDir = path.join(tmpDir, 'test-theme')

  const fakeFolder = path.join(testDir, 'test-theme')
  const fakeFolderWithExistingRepo = path.join(testDir, 'theme-with-existing-repo')
  const fakeFolderWithConfig = path.join(testDir, 'theme-with-config')

  const fakeSource = 'https://github.com/prismicio/fake-theme'
  const fakeSourceWithConfig = 'https://github.com/prismicio/fake-theme-with-config'

  const configFile = 'prismic-configuration.js'

  const zip = ThemeZip.toBuffer()
  const zipWithConfig = ThemeWithConfigZip.toBuffer()

  before(async () => {
    if (fs.existsSync(testDir)) {
      return fs.rmdir(testDir, {recursive: true})
    }
    return Promise.resolve()
  })

  test
  .stderr()
  .stub(lookpath, 'lookpath', async () => false)
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(fakeBase, api => {
    return api
    .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true) // we should really rename this.
    .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
  })
  .nock('https://auth.prismic.io', api => {
    api.get('/validate?token=xyz').reply(200, {})
    api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
  })
  .nock('https://github.com', api => {
    api.head('/prismicio/fake-theme/archive/main.zip').reply(404)
    api.head('/prismicio/fake-theme/archive/master.zip').reply(200)
    return api.get('/prismicio/fake-theme/archive/master.zip')
    .reply(200, zip, {
      'Content-Type': 'application/zip',
      'content-length': zip.length.toString(),
    })
  })
  .command(['theme', fakeSource, '--domain', fakeDomain, '--folder', fakeFolder, '--conf', configFile, '--skip-install'])
  .it('creates a prismic project from a github url', () => {
    const configPath = path.join(fakeFolder, configFile)
    expect(fs.existsSync(fakeFolder)).to.be.true
    const conf = require(configPath)
    expect(conf.prismicRepo).to.include(fakeDomain)
  })

  test
  .stderr()
  .stub(lookpath, 'lookpath', async () => false)
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(fakeBase, api => {
    return api
    .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => false) // we should really rename this.
  })
  .nock('https://auth.prismic.io', api => {
    api.get('/validate?token=xyz').reply(200, {})
    api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
  })
  .nock('https://github.com', api => {
    api.head('/prismicio/fake-theme/archive/main.zip').reply(404)
    api.head('/prismicio/fake-theme/archive/master.zip').reply(200)
    return api.get('/prismicio/fake-theme/archive/master.zip')
    .reply(200, zip, {
      'Content-Type': 'application/zip',
      'content-length': zip.length.toString(),
    })
  })
  .command(['theme', fakeSource, '--domain', fakeDomain, '--folder', fakeFolderWithExistingRepo, '--conf', configFile, '--skip-install', '--existing-repo'])
  .it('when passed existing repo it should not try to create a repository', () => {
    const configPath = path.join(fakeFolderWithExistingRepo, configFile)
    expect(fs.existsSync(fakeFolderWithExistingRepo)).to.be.true
    const conf = require(configPath)
    expect(conf.prismicRepo).to.include(fakeDomain)
  })

  test
  .stderr()
  .stub(lookpath, 'lookpath', async () => false)
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(fakeBase, api => {
    return api
    .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true) // we should really rename this.
    .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
  })
  .nock('https://auth.prismic.io', api => {
    api.get('/validate?token=xyz').reply(200, {})
    api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
  })
  .nock('https://github.com', api => {
    api.head('/prismicio/fake-theme-with-config/archive/main.zip').reply(404)
    api.head('/prismicio/fake-theme-with-config/archive/master.zip').reply(200)
    return api.get('/prismicio/fake-theme-with-config/archive/master.zip')
    .reply(200, zipWithConfig, {
      'Content-Type': 'application/zip',
      'content-length': zipWithConfig.length.toString(),
    })
  })
  .command(['theme', fakeSourceWithConfig, '--domain', fakeDomain, '--folder', fakeFolderWithConfig, '--conf', configFile, '--skip-install'])
  .it('uses prismic-theme.json to configure the repository name to replace', () => {
    const configPath = path.join(fakeFolderWithConfig, configFile)
    expect(fs.existsSync(fakeFolderWithConfig)).to.be.true
    const conf = require(configPath)
    expect(conf.prismicRepo).to.include(fakeDomain)
  })
})
