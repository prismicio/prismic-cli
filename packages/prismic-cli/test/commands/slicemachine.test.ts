import {expect, test, FancyTypes} from '@oclif/test'
import * as path from 'path'
import * as os from 'os'
import * as sinon from 'sinon'
import {fs} from '../../src/utils'
import * as lookpath from 'lookpath'
import * as child_process from 'child_process'
const {SM_FILE} = require('sm-commons/consts')

const globby = require('fast-glob')

const tmpDir = os.tmpdir()
const fakeDomain = 'fake-domain'
const fakeBase = 'https://prismic.io'
const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'

describe('slicemachine', () => {
  describe('Next.js', () => {
    const appName = 'test-slicemachine-next'
    const fakeFolder = path.join(tmpDir, appName)

    before(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
      const pathToTemplate = path.resolve(
        require.resolve('generator-prismic-nextjs'),
        '..',
        'templates',
      )
      return fs.copy(pathToTemplate, fakeFolder)
    })

    const fakeReadFileSync: any = (args: string): string => {
      if (args.endsWith('.yo-rc.json')) return JSON.stringify({'generator-prismic-nextjs': {framework: 'nextjs'}})
      return JSON.stringify({base: fakeBase, cookies: fakeCookies})
    }

    test
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .stub(lookpath, 'lookpath', async () => false)
    .stdin('y\n', 1000) // TODO: force flag is being ignored
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
    })
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .command(['slicemachine', '--setup', '--folder', fakeFolder, '--framework', 'nextjs', '--domain', fakeDomain, '--force', '--skip-install'])
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
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .command(['slicemachine', '--create-slice', '--library', 'slices', '--sliceName', 'MySlice', '--folder', fakeFolder, '--force', '--framework', 'nextjs'])
    .it('create-slice', _ => {
      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices)).to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice)).to.be.true
    })

    test
    .stdin('y\n', 1000)
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(lookpath, 'lookpath', async () => false)
    .command(['slicemachine', '--add-storybook', '--framework', 'nextjs', '--folder', fakeFolder, '--force', '--skip-install'])
    .it('add-storybook', _ => {
      const pathToStoryBook = path.join(fakeFolder, '.storybook/main.js')
      expect(fs.existsSync(pathToStoryBook)).to.be.true
    })
  })

  describe('nuxt', () => {
    const appName = 'test-slicemachine-nuxt'
    const fakeFolder = path.join(tmpDir, appName)

    const fakeReadFileSync: any = (args: string): string => {
      if (args.endsWith('.yo-rc.json')) return JSON.stringify({'generator-prismic-nuxt': {framework: 'nuxt'}})
      return JSON.stringify({base: fakeBase, cookies: fakeCookies})
    }

    before(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
      const pathToTemplate = path.resolve(__dirname, '../__stubs__/nuxt-template')
      return fs.copy(pathToTemplate, fakeFolder)
    })

    test
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .stdin('y\n', 1000) // TODO: Force flag is being ignored
    .stub(lookpath, 'lookpath', async () => false)
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
    })
    .command(['slicemachine', '--setup', '--folder', fakeFolder, '--framework', 'nuxt', '--domain', fakeDomain, '--force', '--skip-install'])
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
    .stdin('y\n', 1000) // TODO: force flag doesn't work
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .command(['slicemachine', '--create-slice', '--library', 'slices', '--sliceName', 'MySlice', '--folder', fakeFolder, '--force', '--framework', 'nuxt'])
    .it('create-slice', _ => {
      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices)).to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice)).to.be.true
    })

    test
    .stdin('y\n', 1000) // TODO: force flag doesn't work
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .stub(lookpath, 'lookpath', async () => false)
    .command(['slicemachine', '--add-storybook', '--framework', 'nuxt', '--folder', fakeFolder, '--force', '--skip-install'])
    .it('add-storybook', async (_, done) => {
      const pathToNuxtConfig = path.join(fakeFolder, 'nuxt.config.js')
      expect(fs.existsSync(pathToNuxtConfig)).to.be.true
      const config = await fs.readFile(pathToNuxtConfig, {encoding: 'utf-8'})
      expect(config).to.include('stories: ["~/slices/**/*.stories.[tj]s", "~/.slicemachine/assets/slices/**/*.stories.[tj]s"]')
      done()
    })
  })

  describe('list', () => {
    test
    .skip()
    .stdout()
    .stderr()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .stub(fs, 'readFile',  async () => JSON.stringify({libraries: ['@/slices']}))
    .stub(globby, 'sync', () => [path.join('project', 'slices', 'MySlice', 'model.json')])
    .command(['slicemachine', '--list'])
    .it('should list slices from sm.json', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.contain('@/slices')
      expect(ctx.stdout).to.contain('MySlice')
    })
  })

  describe('bootstrap', () => {
    const boostrapFakeWriteFile = sinon.fake.resolves(undefined)

    const setup = test
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'existsSync', () => true)
    .stub(fs, 'readFile',  async () => JSON.stringify({apiEndpoint: 'https://marc.cdn.prismic.io/api/v2'}))
    .stub(fs, 'writeFile', boostrapFakeWriteFile)

    setup
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
    })
    .command(['slicemachine', '--bootstrap', '--domain', fakeDomain])
    .it('should reconfigure a projects sm.json file', () => {
      expect(boostrapFakeWriteFile.called).to.be.true
      const lastWriteArgs = boostrapFakeWriteFile.lastCall.args
      const data = lastWriteArgs[lastWriteArgs.length - 1]
      expect(data).to.contain(`https://${fakeDomain}.cdn.prismic.io/api/v2`)
    })

    setup
    .stderr()
    .stub(fs, 'existsSync', () => false)
    .command(['slicemachine', '--bootstrap', '--domain', fakeDomain])
    .it('Should fail if no sm.json file is found', ctx => expect(ctx.stderr).to.contain('sm.json file not found'))
  })

  describe('develop', () => {
    const fakeConfig = JSON.stringify({base: fakeBase, cookies: fakeCookies})
    const fakeSmJson = JSON.stringify({apiEndpoint: 'https://fake.cdn.prismic.io/api/v2'})
    const fakeAuth = (api: FancyTypes.NockScope) => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    }

    const fakeExecSync = sinon.fake.returns(undefined)

    const fakeReadFileSync: any = (args: string): string => {
      if (args.includes(SM_FILE)) return fakeSmJson
      return fakeConfig
    }

    test
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .nock('https://auth.prismic.io', fakeAuth)
    .stub(lookpath, 'lookpath', async () => true)
    .stub(fs, 'existsSync', () => true)
    .stub(child_process, 'execSync', fakeExecSync)
    .command(['slicemachine', '--develop'])
    .it('when authenticated and inside of a nodejs project it should call yarn slicemachine', () => {
      expect(fakeExecSync.firstCall.args[0]).to.equal('yarn slicemachine')
    })

    test
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .nock('https://auth.prismic.io', fakeAuth)
    .stub(lookpath, 'lookpath', async () => false)
    .stub(fs, 'existsSync', () => true)
    .stub(child_process, 'execSync', fakeExecSync)
    .command(['slicemachine', '--develop'])
    .it('when authenticated and inside of a nodejs project it should call npm run slicemachine', () => {
      expect(fakeExecSync.secondCall.args[0]).to.equal('npm run slicemachine')
    })
  })
})
