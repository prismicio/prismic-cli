import {expect, test, FancyTypes} from '@oclif/test'
import * as path from 'path'
import * as os from 'os'
import * as sinon from 'sinon'
import {fs} from '../../src/utils'
import * as lookpath from 'lookpath'
import * as child_process from 'child_process'
import SliceMachine from '../../src/commands/slicemachine'

const {SM_FILE} = require('sm-commons/consts')

const globby = require('fast-glob')

const tmpDir = os.tmpdir()
const fakeDomain = 'fake-domain'
const fakeBase = 'https://prismic.io'
const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'

describe('slicemachine', () => {
  test.it('flags', () => {
    expect(SliceMachine.flags['add-storybook']).to.exist
    expect(SliceMachine.flags.bootstrap).to.exist
    expect(SliceMachine.flags['create-slice']).to.exist
    expect(SliceMachine.flags.customTypeEndpoint).to.exist
    expect(SliceMachine.flags.develop).to.exist
    expect(SliceMachine.flags.domain).to.exist
    expect(SliceMachine.flags['existing-repo']).to.exist
    expect(SliceMachine.flags.folder).to.exist
    expect(SliceMachine.flags.force).to.exist
    expect(SliceMachine.flags.framework).to.exist
    expect(SliceMachine.flags.help).to.exist
    expect(SliceMachine.flags.library).to.exist
    expect(SliceMachine.flags.list).to.exist
    expect(SliceMachine.flags.setup).to.exist
    expect(SliceMachine.flags['skip-install']).to.exist
    expect(SliceMachine.flags.sliceName).to.exist
  })

  describe('Next.js', () => {
    const nextFolder = path.join(tmpDir, 'test-sm-next')
    const fakeFolder = path.join(nextFolder, 'setup')
    const fakeFolderForExistingRepo = path.join(tmpDir)

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
    .stderr()
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
      expect(fs.existsSync(pkJsonPath), 'should create package.json').to.be.true
      expect(fs.existsSync(smJsonPath), 'should create sm.json').to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint, 'sm.json should contain api endpoint').to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine, 'package.json should contain slicemachine script').to.equal('start-slicemachine --port 9999')
    })

    test
    .stderr()
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .command(['slicemachine', '--create-slice', '--library', 'slices', '--sliceName', 'MySlice', '--folder', fakeFolder, '--force', '--framework', 'nextjs'])
    .it('create-slice', _ => {
      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices), 'should create library').to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice), 'should create slice in library').to.be.true
    })

    test
    .stderr()
    .stdin('y\n', 1000)
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(lookpath, 'lookpath', async () => false)
    .command(['slicemachine', '--add-storybook', '--framework', 'nextjs', '--folder', fakeFolder, '--force', '--skip-install'])
    .it('add-storybook', _ => {
      const pathToStoryBook = path.join(fakeFolder, '.storybook/main.js')
      expect(fs.existsSync(pathToStoryBook), 'should add main.js to storybook').to.be.true
    })

    test
    .stderr()
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .stub(lookpath, 'lookpath', async () => false)
    .stdin('y\n', 1000) // TODO: force flag is being ignored
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
    })
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .command(['slicemachine', '--setup', '--folder', fakeFolderForExistingRepo, '--framework', 'nextjs', '--domain', fakeDomain, '--force', '--skip-install', '--existing-repo'])
    .it('does not create a new repo when --existing-repo is passed', _ => {
      const pkJsonPath = path.join(fakeFolderForExistingRepo, 'package.json')
      const smJsonPath = path.join(fakeFolderForExistingRepo, 'sm.json')
      expect(fs.existsSync(pkJsonPath), 'should create package.json').to.be.true
      expect(fs.existsSync(smJsonPath), 'should create sm.json').to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint, 'sm.json should contain api endpoint').to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine, 'package.json should contain slicemachine script').to.equal('start-slicemachine --port 9999')
    })
  })

  describe('nuxt', () => {
    const nuxtFolder = path.join(tmpDir, 'sm-nuxt')
    const fakeFolder = path.join(nuxtFolder, 'test-sm-setup')
    const fakeFolderForExistingRepo = path.join(nuxtFolder, 'test-sm-existing-nuxt')

    const fakeReadFileSync: any = (args: string): string => {
      if (args.endsWith('.yo-rc.json')) return JSON.stringify({'generator-prismic-nuxt': {framework: 'nuxt'}})
      return JSON.stringify({base: fakeBase, cookies: fakeCookies})
    }

    before(async () => {
      if (fs.existsSync(nuxtFolder)) {
        await fs.rmdir(nuxtFolder, {recursive: true})
      }
      const pathToTemplate = path.resolve(__dirname, '../__stubs__/nuxt-template')
      await fs.copy(pathToTemplate, fakeFolder)
      return fs.copy(pathToTemplate, fakeFolderForExistingRepo)
    })

    test
    .stderr()
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
      expect(fs.existsSync(pkJsonPath), 'should create package.json').to.be.true
      expect(fs.existsSync(smJsonPath), 'should crete sm.json').to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint, 'sm.json should contain apiEndpoint').to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine, 'should add slicemachine to package.json scripts').to.equal('start-slicemachine --port 9999')
    })

    test
    .stderr()
    .stdin('y\n', 1000) // TODO: force flag doesn't work
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .command(['slicemachine', '--create-slice', '--library', 'slices', '--sliceName', 'MySlice', '--folder', fakeFolder, '--force', '--framework', 'nuxt'])
    .it('create-slice', async _ => {
      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices), 'should create slices library').to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice)).to.be.true

      const smJsonPath = path.join(fakeFolder, 'sm.json')
      const smJson = await fs.readFile(smJsonPath, 'utf-8')
      expect(smJson).to.include('@/slices')

      const pathToStory = path.join(fakeFolder, '.slicemachine', 'assets', 'slices', 'MySlice', 'index.stories.js')
      const storyFile = await fs.readFile(pathToStory, 'utf-8')
      expect(storyFile).to.include('./../../../../slices/MySlice')
    })

    test
    .stderr()
    .stdin('y\n', 1000) // TODO: force flag doesn't work
    .stub(fs, 'readFileSync', fakeReadFileSync)
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => true)
    .stub(lookpath, 'lookpath', async () => false)
    .command(['slicemachine', '--add-storybook', '--framework', 'nuxt', '--folder', fakeFolder, '--force', '--skip-install'])
    .it('add-storybook', async (_, done) => {
      const pathToNuxtConfig = path.join(fakeFolder, 'nuxt.config.js')
      expect(fs.existsSync(pathToNuxtConfig), 'nuxt config not found').to.be.true
      const config = await fs.readFile(pathToNuxtConfig, {encoding: 'utf-8'})
      expect(config).to.include('stories: ["~/slices/**/*.stories.[tj]s", "~/.slicemachine/assets/slices/**/*.stories.[tj]s"]')
      done()
    })

    test
    .stderr()
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
    })
    .command(['slicemachine', '--setup', '--folder', fakeFolderForExistingRepo, '--framework', 'nuxt', '--domain', fakeDomain, '--force', '--skip-install', '--existing-repo'])
    .it('setup with existing repo does not create a new repo', _ => {
      const pkJsonPath = path.join(fakeFolderForExistingRepo, 'package.json')
      const smJsonPath = path.join(fakeFolderForExistingRepo, 'sm.json')
      expect(fs.existsSync(pkJsonPath), 'should create package.json').to.be.true
      expect(fs.existsSync(smJsonPath), 'should crete sm.json').to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint, 'sm.json should contain apiEndpoint').to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine, 'should add slicemachine to package.json scripts').to.equal('start-slicemachine --port 9999')
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
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
    })
    .command(['slicemachine', '--bootstrap', '--domain', fakeDomain, '--existing-repo'])
    .it('existing-repo flag should not create a new repo', () => {
      expect(boostrapFakeWriteFile.called).to.be.true
      const lastWriteArgs = boostrapFakeWriteFile.lastCall.args
      const data = lastWriteArgs[lastWriteArgs.length - 1]
      expect(data).to.contain(`https://${fakeDomain}.cdn.prismic.io/api/v2`)
    })
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
