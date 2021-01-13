import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'
import * as sinon from 'sinon'
import * as os from 'os'
import * as path from 'path'
import * as qs from 'qs'
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

  describe('validateRepositoryName', () => {
    const fakeBase = 'https://prismic.io'
    const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits'
    const repoName = 'example-repo'
    const config = JSON.stringify({base: fakeBase, cookies: fakeCookies}, null, '\t')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const catchFn = sinon.fake()
      const thenFn = sinon.fake()
      await ctx.prismic.validateRepositoryName().then(thenFn).catch(catchFn)

      expect(catchFn.getCall(0).firstArg.message).to.equal('repository name is required')
      expect(thenFn.notCalled).to.be.true
    })
    .it('should fail if subdomain is not defined')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const catchFn = sinon.fake()
      const thenFn = sinon.fake()
      await ctx.prismic.validateRepositoryName('abc').then(thenFn).catch(catchFn)

      expect(catchFn.getCall(0).firstArg.message).to.contain('Must have four or more alphanumeric characters and/or hyphens.')
      expect(thenFn.notCalled).to.be.true
    })
    .it('should fail if name length is less than 4')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const catchFn = sinon.fake()
      const thenFn = sinon.fake()
      await ctx.prismic.validateRepositoryName('abc.').then(thenFn).catch(catchFn)

      expect(catchFn.getCall(0).firstArg.message).to.contain('Most contain only letters, numbers and hyphens.')
      expect(thenFn.notCalled).to.be.true
    })
    .it('should fail if the name contains non alphanumeric characters')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const catchFn = sinon.fake()
      const thenFn = sinon.fake()
      await ctx.prismic.validateRepositoryName('-abc').then(thenFn).catch(catchFn)

      expect(catchFn.getCall(0).firstArg.message).to.contain('start with a letter')
      expect(thenFn.notCalled).to.be.true
    })
    .it('should fail if the name starts with a hyphen')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const catchFn = sinon.fake()
      const thenFn = sinon.fake()
      await ctx.prismic.validateRepositoryName('abc-').then(thenFn).catch(catchFn)

      expect(catchFn.getCall(0).firstArg.message).to.contain('Must end in a letter or a number')
      expect(thenFn.notCalled).to.be.true
    })
    .it('should fail if the name ends with a hyphen')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .nock(fakeBase, api => {
      return api.get(`/app/dashboard/repositories/${repoName}/exists`)
      .reply(200, () => false)
    })
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const catchFn = sinon.fake()
      const thenFn = sinon.fake()
      await ctx.prismic.validateRepositoryName(repoName).then(thenFn).catch(catchFn)
      expect(thenFn.notCalled).to.be.true
      expect(catchFn.getCall(0).firstArg.message).to.contain('already in use')
    })
    .it('should fail if repo name is not available')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .nock(fakeBase, api => {
      return api.get(`/app/dashboard/repositories/${repoName}/exists`)
      .reply(200, () => true)
    })
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.validateRepositoryName(repoName)
      expect(result).to.equal(repoName)
    })
    .it('should pass if repo name is valid and available')
  })

  describe('createRepository', () => {
    const fakeBase = 'https://prismic.io'
    const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic_auth=xyz'
    const repoName = 'example-repo'
    const config = JSON.stringify({base: fakeBase, cookies: fakeCookies}, null, '\t')
    const configWithOauth = JSON.stringify({base: fakeBase, oauthAccessToken: 'token'})

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .add('prismic', () => new Prismic())
    .nock(fakeBase, api => {
      // const query = qs.stringify({domain: repoName, plan: 'personal', isAnnual: 'false'})
      return api.post('/authentication/newrepository', /* query */)
      .reply(200, repoName)
    })
    .do(async ctx => {
      const result = await ctx.prismic.createRepository({domain: repoName})
      expect(result.data).to.equal(repoName)
    })
    .it('create a repo using the cookie for auth')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(configWithOauth))
    .nock('https://api.prismic.io', api => {
      const query = qs.stringify({domain: repoName, plan: 'personal', isAnnual: 'false', access_token: 'token'})
      return api.post('/management/repositories', query).reply(200, {
        domain: repoName,
      })
    })
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.createRepository({domain: repoName})
      expect(result.data.domain).to.equal(repoName)
    })
    .it('should create a repo using an oauth access token')
  })

  describe('isAuthenticated', () => {
    test
    .stub(fs, 'readFileSync', sinon.fake.throws(fileNotFound))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.isAuthenticated()
      expect(result).to.be.false
    })
    .it('should return false if no cookie or oauth token is found')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({cookies: 'prismic_auth=b'})))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.isAuthenticated()
      expect(result).to.be.false
    })
    .it('should fail in cookie does not contain SESSION')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({cookies: 'SESSION=a'})))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.isAuthenticated()
      expect(result).to.be.false
    })
    .it('should fail if a cookie does not contain prismic_auth')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({cookies: 'SESSION=a; prismic_auth=b'})))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.isAuthenticated()
      expect(result).to.be.true
    })
    .it('should return true if a cookie is found')

    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({oauthAccessToken: 'xyz'})))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const result = await ctx.prismic.isAuthenticated()
      expect(result).to.be.true
    })
    .it('should return true if an oauth access token is found')
  })

  describe('prismic.axios', () => {
    test
    .stub(fs, 'readFileSync', sinon.fake.returns(JSON.stringify({base: 'https://prismic.io', cookies: 'foo=bar'})))
    .nock('https://example.com', api => api.get('/').reply(200, 'good'))
    .add('prismic', () => new Prismic())
    .do(async ctx => {
      const axios = ctx.prismic.axios({baseURL: 'https://example.com'})
      const result = await axios.get('/')
      expect(result.data).to.equal('good')
    })
    .it('axios instance can be configured')
  })
})
