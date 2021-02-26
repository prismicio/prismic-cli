import {expect, test} from '@oclif/test'
import * as path from 'path'
import * as os from 'os'
import {fs} from '../../src/utils'


const tmpDir = os.tmpdir()
const fakeDomain = 'fake-domain'
const fakeBase = 'https://prismic.io'
const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'

describe.only('slicemachine', () => {

  describe('Next.js', () => {
    const appName = 'test-slicemachine-next'
    const fakeFolder = path.join(tmpDir, appName)

    before(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
      const pathToTemplate = path.resolve(__dirname, '../../src/generators/NextJS/templates')
      return fs.copy(pathToTemplate, fakeFolder)
    })
    
    test
    .stdout()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
      .post('/authentication/newrepository').reply(200, fakeDomain)
    })
    .command(['slicemachine', '--setup', '--folder', fakeFolder, '--framework', 'next', '--domain', fakeDomain, '--force'])
    .it('setup creates sm.json', _ => {
      const pkJsonPath = path.join(fakeFolder, 'package.json')
      const smJsonPath = path.join(fakeFolder, 'sm.json')
      expect(fs.existsSync(pkJsonPath)).to.be.true
      expect(fs.existsSync(smJsonPath)).to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint).to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine).to.equal('start-slicemachine --port 9999')
    })

    test
    .stdout()
    .command(['slicemachine', '--create-slice', '--library', 'slices', '--sliceName', 'MySlice', '--folder', fakeFolder, '--force', '--framework', 'next'])
    .it('create-slice', _ => {
      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices)).to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice)).to.be.true
    })

    test
    .stdout()
    .command(['slicemachine', '--add-storybook', '--framework', 'next', '--folder', fakeFolder, '--force'])
    .it('add-storybook', _ => {
      const pathToStoryBook = path.join(fakeFolder, '.storybook/main.js')
      expect(fs.existsSync(pathToStoryBook)).to.be.true
    })
  })

  // describe('nuxt', () => {})
})
