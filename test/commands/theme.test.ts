import {expect, test} from '@oclif/test'
import * as path from 'path'
import * as os from 'os'
import {fs} from '../../src/utils'
import {Theme as ThemeZip} from '../__stubs__/template'

describe('theme', () => {
  const fakeDomain = 'fake-theme-domain'
  const fakeBase = 'https://prismic.io'
  const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'
  const tmpDir = os.tmpdir()

  let fakeFolder = path.join(tmpDir, 'test-theme')

  const fakeSource = 'https://github.com/prismicio/fake-theme'

  const configFile = 'prismic-configuration.js'

  const zip = ThemeZip.toBuffer()

  beforeEach(async () => {
    if (fs.existsSync(fakeFolder)) {
      await fs.rmdir(fakeFolder, {recursive: true})
      fakeFolder = path.join(tmpDir, 'test-theme')
    }
  })

  test
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(fakeBase, api => {
    return api
    .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true) // we should really rename this.
    .post('/authentication/newrepository').reply(200, fakeDomain)
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
  .command(['theme', fakeSource, '--domain', fakeDomain, '--folder', fakeFolder, '--config', configFile])
  .it('creates a prismic project from a github url', () => {
    const configPath = path.join(fakeFolder, configFile)
    expect(fs.existsSync(fakeFolder)).to.be.true
    const conf = require(configPath)
    expect(conf.prismicRepo).to.include(fakeDomain)
  })
})
