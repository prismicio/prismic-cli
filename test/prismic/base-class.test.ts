import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'
import * as sinon from 'sinon'
import * as os from 'os'
import * as path from 'path'
import {IConfig} from '@oclif/config'
import Prismic, {
  createDefaultConfig,
  getOrCreateConfig,
  DEFAULT_CONFIG,
} from '../../src/prismic/base-class'

const fileNotFound = new Error()
Object.assign(fileNotFound, {code: 'ENOENT'})

describe('prismic/base-class', () => {
  afterEach(() => {
    sinon.restore()
  })

  describe('createDefaultConfig', () => {
    const fakeWrite = sinon.fake()

    test
    .stub(fs, 'writeFileSync', fakeWrite)
    .it('should call fs.writeFileSync with a path and data to wirte', () => {
      const pathToFile = './prismic.json'
      const result = createDefaultConfig(pathToFile)

      expect(JSON.parse(result)).to.deep.equal(DEFAULT_CONFIG)
      expect(fakeWrite.calledOnce).to.be.true
      expect(fakeWrite.getCall(0).args).to.deep.equal([pathToFile, result, 'utf-8'])
    })
  })

  describe('getOrCreateConfig', () => {
    const config = JSON.stringify(DEFAULT_CONFIG, null, '\t')
    const pathToFile = './prismic.json'

    const fakeWriteOnFail = sinon.fake()
    const fakeReadFailENOENT = sinon.fake.throws(fileNotFound)

    test
    .stub(fs, 'writeFileSync', fakeWriteOnFail)
    .stub(fs, 'readFileSync', fakeReadFailENOENT)
    .it('should create a config file and return the config file when no config file is found', () => {
      const result = getOrCreateConfig(pathToFile)
      expect(result).to.deep.equal(DEFAULT_CONFIG)
      expect(fakeReadFailENOENT.calledOnce).to.be.true
      expect(fakeWriteOnFail.calledOnce).to.be.true
      expect(fakeWriteOnFail.getCall(0).args).to.deep.equal([pathToFile, config, 'utf-8'])
    })

    const fakeWrite = sinon.fake()
    const fakeRead = sinon.fake.returns(config)

    test
    .stub(fs, 'writeFileSync', fakeWrite)
    .stub(fs, 'readFileSync', fakeRead)
    .it('if .prismic config file is found is should return the parsed', () => {
      const result = getOrCreateConfig(pathToFile)
      expect(result).to.deep.equal(DEFAULT_CONFIG)
      expect(fakeRead.calledOnce).to.be.true
      expect(fakeWrite.notCalled)
    })

    const fakeReadFail = sinon.fake.throws(new Error('whoops'))
    const fakeWriteNotCalled = sinon.fake()

    test
    .stub(fs, 'writeFileSync', fakeWriteNotCalled)
    .stub(fs, 'readFileSync', fakeReadFail)
    .it('should throw an error if reading the config file exists but fails to read', () => {
      expect(fakeWriteNotCalled.notCalled).to.be.true
      expect(() => getOrCreateConfig(pathToFile)).to.throw('whoops')
    })
  })

  describe('new Prismic()', () => {
    const fakeReadFail = sinon.fake.throws(fileNotFound)
    const fakeWriteFileSync = sinon.fake.resolves(null)
    test
    .stub(fs, 'readFileSync', fakeReadFail)
    .stub(fs, 'writeFileSync', fakeWriteFileSync)
    .it('inistialisation no with .prismic should create config file', () => {
      const prismic = new Prismic()
      expect(prismic.base).to.equal('https://prismic.io')
      expect(prismic.cookies).to.equal('')
      expect(prismic.configPath).to.include('.prismic')
      expect(fakeWriteFileSync.called)
      expect(fakeWriteFileSync.getCall(0).args[0]).to.equal(prismic.configPath)
      expect(fakeWriteFileSync.getCall(0).args[1]).to.include(prismic.base)
    })

    test
    .stub(fs, 'readFileSync', fakeReadFail)
    .stub(fs, 'writeFileSync', fakeWriteFileSync)
    .it('initalisation with a config passed by oclif', () => {
      const config = {home: path.join(os.homedir())} as IConfig
      const prismic = new Prismic(config)
      expect(prismic.configPath).to.include(os.homedir())
    })

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({base: 'https://example.com', cookies: ''})))
    .stub(fs, 'writeFileSync', fakeWriteFileSync)
    .it('initalisation from local config', () => {
      const prismic = new Prismic()
      expect(prismic.base).to.equal('https://example.com')
    })

    const fakeUnlink = sinon.fake.resolves(null)

    test
    .stub(fs, 'readFileSync', fakeReadFail)
    .stub(fs, 'writeFileSync', fakeWriteFileSync)
    .stub(fs, 'unlink', fakeUnlink)
    .it('Prismic.logout should remove .prismic config file from file system', async () => {
      const prismic = new Prismic()
      await prismic.logout()
      expect(fakeUnlink.getCall(0).args[0]).to.equal(prismic.configPath)
      expect(prismic.cookies).to.equal('')
      expect(prismic.base).to.equal('https://prismic.io')
    })

    const email = 'prismic@example.com'
    const password = 'guest'
    const fakeBase = 'https://prismic.io'
    const fakeWriteFile = sinon.fake.resolves(null)

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({base: fakeBase, cookies: ''})))
    .stub(fs, 'writeFileSync', fakeWriteFileSync)
    .stub(fs, 'writeFile', fakeWriteFile)
    .nock(fakeBase, api => {
      return api.post('/authentication/signin', `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
      .reply(200, {}, {'set-cookie': ['SESSION=tea; DOMAIN=.prismic.io', 'X_XSFR=biscuits']})
    })
    .it('Prismic.login should update .prismic with cookies', async () => {
      const prismic = new Prismic()
      expect(prismic.base).to.equal(fakeBase)
      expect(prismic.cookies).to.equal('')

      await prismic.login({email, password})
      expect(prismic.cookies).to.include('biscuits').and.to.include('tea')
      expect(fakeWriteFile.getCall(0).args[0]).to.equal(prismic.configPath)
      expect(fakeWriteFile.getCall(0).args[1]).to.contain('tea').and.to.include('biscuits')
    })
  })
})
