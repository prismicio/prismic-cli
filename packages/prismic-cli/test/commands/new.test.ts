import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'
import {NodeJS as StubNodeJSZip} from '../__stubs__/template'
import * as path from 'path'
import * as os from 'os'
import * as inquirer from 'inquirer'
import * as sinon from 'sinon'
import New from '../../src/commands/new'
import cli from 'cli-ux'
import * as lookpath from 'lookpath'

describe('new', () => {
  test.do(() => {
    expect(New.flags.domain).to.exist
    expect(New.flags.folder).to.exist
    expect(New.flags.force).to.exist
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
    .stderr()
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(lookpath, 'lookpath', async () => false)
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
    .command(['new', '--domain', fakeDomain, '--folder', fakeFolder, '--template', 'NodeJS', '--skip-install'])
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
    .command(['new', '--domain', fakeDomain, '--folder', fakeFolder, '--template', 'NodeJS', '--force', '--skip-install'])
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
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(lookpath, 'lookpath', async () => false)
    .stub(inquirer, 'prompt', async () => {
      return {
        slicemachine: true,
        library: 'slices',
        sliceName: 'TestSlice',
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
    .command(['new', '--template', 'NextJS', '--domain', fakeDomain, '--folder', fakeFolder, '--force', '--skip-install'])
    .it('should generate a next.js slicemachine project', async _ => {
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

      const pathToMySlice = path.join(pathToSlices, 'TestSlice')
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
      slicemachine: true,
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
    .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
    .stub(fs, 'writeFile', () => Promise.resolve())
    .stub(lookpath, 'lookpath', async () => false)
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
      expect(config).to.include('stories: ["~/slices/**/*.stories.[tj]s", "~/.slicemachine/assets/slices/**/*.stories.[tj]s"]')
    })
  })
})
