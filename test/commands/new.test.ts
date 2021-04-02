import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'
import {NodeJS as StubNodeJSZip} from '../__stubs__/template'
import * as path from 'path'
import * as os from 'os'
import * as inquirer from 'inquirer'
import * as sinon from 'sinon'
import New from '../../src/commands/new'
import cli from 'cli-ux'

describe('new', () => {
  test.do(() => {
    expect(New.flags.domain).to.exist
    expect(New.flags.folder).to.exist
    expect(New.flags.force).to.exist
    expect(New.flags.generator).to.exist
    expect(New.flags.help).to.exist
    expect(New.flags['skip-install']).to.exist
    expect(New.flags.template).to.exist
  }).it('flags')

  const fakeDomain = 'fake-domain'
  const fakeBase = 'https://prismic.io'
  const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'
  const tmpDir = os.tmpdir()

  describe('checking for auth', () => {
    const fakeFolder = path.join(tmpDir, 'test-new-login')

    beforeEach(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
    })

    test
    .stdout()
    .stderr()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(cli, 'prompt', () => async (message: string): Promise<string> => {
      if (message.includes('Email')) return Promise.resolve('email')
      if (message.includes('Password')) return Promise.resolve('password')
      return Promise.resolve('')
    })
    .nock('https://auth.prismic.io', api => api.get('/validate?token=xyz').reply(403, {}))
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true) // we should really rename this.
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
      .post('/authentication/signin', 'email=email&password=password').reply(200, {})
    })
    .nock('https://github.com', api => {
      api.get('/prismicio/nodejs-sdk/archive/master.zip')
      .reply(200, StubNodeJSZip.toBuffer(), {'Content-Type': 'application/zip'})
    })
    .command(['new', '--domain', fakeDomain, '--folder', fakeFolder, '--template', 'NodeJS'])
    .it('should call login if user is not authenticated')
  })

  describe('nodejs-sdk', () => {
    const fakeFolder = path.join(tmpDir, 'test-new-nodejs-sdk')

    beforeEach(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
    })

    test
    .stdout()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true) // we should really rename this.
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
    })
    .nock('https://github.com', api => {
      api.get('/prismicio/nodejs-sdk/archive/master.zip')
      .reply(200, StubNodeJSZip.toBuffer(), {'Content-Type': 'application/zip'})
    })
    .command(['new', '--domain', fakeDomain, '--folder', fakeFolder, '--template', 'NodeJS', '--force'])
    .it('creates a new repository from a given template in: ' + fakeFolder, () => {
      const configPath = path.join(fakeFolder, 'prismic-configuration.js')
      expect(fs.existsSync(fakeFolder)).to.be.true
      const conf = require(configPath)
      expect(conf.apiEndpoint).to.include(fakeDomain)
    })
  })

  describe('next', () => {
    const fakeFolder = path.join(tmpDir, 'test-new-next')

    before(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
    })

    test
    .stdout()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(inquirer, 'prompt', async () => {
      return {
        library: 'slices',
        sliceName: 'MySlice',
      }
    })
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'some-token')
    })
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
    })
    .command(['new', '--template', 'Next', '--domain', fakeDomain, '--folder', fakeFolder, '--force', '--skip-install'])
    .it('should generate a next.js slicemachine project', _ => {
      const pkJsonPath = path.join(fakeFolder, 'package.json')
      const smJsonPath = path.join(fakeFolder, 'sm.json')
      expect(fs.existsSync(pkJsonPath)).to.be.true
      expect(fs.existsSync(smJsonPath)).to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint).to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine).to.equal('start-slicemachine --port 9999')

      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices)).to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice)).to.be.true

      const pathToStoryBook = path.join(fakeFolder, '.storybook/main.js')
      expect(fs.existsSync(pathToStoryBook)).to.be.true
    })
  })

  describe('nuxt', () => {
    const fakeFolder = path.join(tmpDir, 'test-new-nuxt')

    before(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
    })

    const stubResp = sinon.stub()
    .onFirstCall()
    .resolves({
      name: fakeDomain,
      language: 'js',
      pm: 'yarn',
      ui: 'none',
      features: [],
      linter: [],
      test: 'none',
      mode: 'universal',
      target: 'server',
      devTools: [],
      gitUsername: 'none',
      vcs: 'none',
    })
    .onSecondCall()
    .resolves({
      library: 'slices',
      sliceName: 'MySlice',
    })
    .onThirdCall()
    .resolves({
      library: 'slices',
      sliceName: 'MySlice',
    })

    test
    .stdout()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(inquirer, 'prompt', stubResp)
    .nock(fakeBase, api => {
      return api
      .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
      .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
    })
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .command(['new', '--template', 'Nuxt', '--domain', fakeDomain, '--folder', fakeFolder, '--force', '--skip-install'])
    .it('should generate a nuxt slicemachine project', async _ => {
      const pkJsonPath = path.join(fakeFolder, 'package.json')
      const smJsonPath = path.join(fakeFolder, 'sm.json')
      expect(fs.existsSync(pkJsonPath)).to.be.true
      expect(fs.existsSync(smJsonPath)).to.be.true

      const smJson = require(smJsonPath)
      const pkJson = require(pkJsonPath)

      expect(smJson.apiEndpoint).to.contain(fakeDomain)
      expect(pkJson.scripts.slicemachine).to.equal('start-slicemachine --port 9999')

      const pathToSlices = path.join(fakeFolder, 'slices')
      expect(fs.existsSync(pathToSlices)).to.be.true

      const pathToMySlice = path.join(pathToSlices, 'MySlice')
      expect(fs.existsSync(pathToMySlice)).to.be.true

      const pathToNuxtConfig = path.join(fakeFolder, 'nuxt.config.js')
      expect(fs.existsSync(pathToNuxtConfig)).to.be.true
      const config = await fs.readFile(pathToNuxtConfig, {encoding: 'utf-8'})
      expect(config).to.include('stories: ["~/slices/**/*.stories.[tj]s"]')
    })
  })

  describe('generator', () => {
    const fakeFolder = path.join(tmpDir, 'test-new-generator')
    const fakeGenerator = path.resolve(__dirname, '../__stubs__/fake-generator')
    const fakeYeomanGenerator = path.resolve(__dirname, '../__stubs__/generator-fake-yeoman-generator')

    before(async () => {
      if (fs.existsSync(fakeFolder)) {
        await fs.rmdir(fakeFolder, {recursive: true})
      }
    })

    const fakeReadFileSync = sinon.stub()
    fakeReadFileSync.onCall(0).returns(JSON.stringify({base: fakeBase, cookies: fakeCookies}))

    test
    .stdout()
    .stderr()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', () => false)
    .nock(fakeBase, api => api.get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true))
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .command(['new', '--generator', fakeGenerator, '--force', '--domain', fakeDomain, '--folder', fakeFolder])
    .it('should warn the user if generator does not exist', ctx => {
      expect(ctx.stderr).to.contain('Warning: Could not find')
    })

    test
    .stdout()
    .stderr()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(fs, 'existsSync', sinon.stub().onCall(0).returns(true).onCall(1).returns(true).onCall(2).returns(false).onCall(3).returns(false))
    .nock(fakeBase, api => api.get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true))
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .command(['new', '--generator', fakeYeomanGenerator, '--force', '--domain', fakeDomain, '--folder', fakeFolder])
    .it('should warn the user if generator does not exist', ctx => {
      expect(ctx.stderr).to.contain('main field is misconfigured... trying')
      expect(ctx.stderr).to.contain('did not resolve, exiting')
    })

    test
    .stdout()
    .stderr()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .nock(fakeBase, api => api.get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true))
    .nock('https://auth.prismic.io', api => {
      api.get('/validate?token=xyz').reply(200, {})
      api.get('/refreshtoken?token=xyz').reply(200, 'xyz')
    })
    .command(['new', '--generator', fakeYeomanGenerator, '--force', '--domain', fakeDomain, '--folder', fakeFolder])
    .it('should run a yeoman generator', ctx => {
      expect(ctx.stdout).to.contain('Done running the generator')
    })
  })
})
