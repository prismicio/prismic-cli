import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'
import StubNodeJSZip from '../__stubs__/template'
import * as path from 'path'
import * as os from 'os'

describe('new', () => {
  const fakeDomain = 'fake-domain'
  const fakeBase = 'https://wroom.test'
  const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic_auth=xyz'
  const tmpDir = os.tmpdir()
  // const tmpDir = '__tmp__'
  const fakeFolder = path.join(tmpDir, 'test-new-nodejs-sdk')

  before(async () => {
    if (fs.existsSync(fakeFolder)) {
      await fs.rmdir(fakeFolder, {recursive: true})
    }
  })

  test
  .only()
  //.stdout()
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .nock(fakeBase, api => {
    return api
    .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true) // we should really rename this.
    .post('/authentication/newrepository').reply(200, fakeDomain)
  })
  .nock('https://github.com', api => {
    api.get('/prismicio/nodejs-sdk/archive/master.zip')
    .reply(200, StubNodeJSZip.toBuffer(), {'Content-Type': 'application/zip'})
  })

  .command(['new', '--domain', fakeDomain, '--folder', fakeFolder, '--template', 'NodeJS'])

  .it('creates a new repository from a given template in: ' + fakeFolder, () => {
    const configPath = path.join(fakeFolder, 'prismic-configuration.js')
    console.log({ configPath })
    expect(fs.existsSync(fakeFolder)).to.be.true
    const conf = require(configPath)
    expect(conf.apiEndpoint).to.include(fakeDomain)
  })
})
