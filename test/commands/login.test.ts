import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'
import {fs} from '../../src/utils'
import cli from 'cli-ux'
import Login from '../../src/commands/login'

describe('login', () => {
  test
  .it('login flags', () => {
    expect(Login.flags.email).exist
    expect(Login.flags.password).exist
    expect(Login.flags.base).exist
    expect(Login.flags.oauthaccesstoken).exist
  })

  const fakeEmail = 'prismic@example.com'
  const fakePassword = 'guest'
  const fakeBase = 'https://example.com'
  const prismicBase = 'https://prismic.io'
  const fakeOuath = 'token'
  const fakeErrorFileNotFound = new Error()
  Object.assign(fakeErrorFileNotFound, {code: 'ENOENT'})

  const fakeReadFail = sinon.fake.throws(fakeErrorFileNotFound)
  const fakeReadFileSync = sinon.fake.returns(JSON.stringify({base: fakeBase, cookies: ''}))
  const fakeCookie = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=foo'

  const fakeWriteFile = sinon.fake.resolves(null)
  const fakeWriteFileSync = sinon.fake.returns(null)

  test
  .stdout()
  .nock(fakeBase, api => {
    return api
    .post('/authentication/signin', `email=${encodeURIComponent(fakeEmail)}&password=${encodeURIComponent(fakePassword)}`)
    .reply(200, {}, {'set-cookie': [fakeCookie]})
  })
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)
  .command(['login', '--email', fakeEmail, '--password', fakePassword, '--base', fakeBase])
  .it('login with email and password', ctx => {
    expect(fakeWriteFile.getCall(0).args[1]).to.contain('tea').and.to.include('biscuits')
    expect(ctx.stdout).to.contain(fakeBase)
  })

  test
  .stdout()
  .nock(prismicBase, api => {
    return api
    .post('/authentication/signin', `oauthaccesstoken=${encodeURIComponent(fakeOuath)}`)
    .reply(200, {}, {'set-cookie': [fakeCookie]})
  })
  .stub(fs, 'readFileSync', fakeReadFail)
  .stub(fs, 'writeFileSync', fakeWriteFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)

  .command(['login', '--oauthaccesstoken', fakeOuath])
  .it('login with oauthaccesstoken', ctx => {
    expect(fakeReadFail.called).to.be.true
    const fakeWriteFileSyncArgs = fakeWriteFileSync.getCall(0).args
    expect(fakeWriteFileSyncArgs[0]).to.contain('.prismic')
    expect(fakeWriteFileSyncArgs[1]).to.contain(prismicBase)
    expect(fakeWriteFile.getCall(1).args[1]).to.contain('.prismic')
    expect(fakeWriteFile.getCall(1).args[1]).to.contain('tea').and.to.include('biscuits')
    expect(ctx.stdout).to.contain(prismicBase)
  })

  test
  .stdout()
  .stub(cli, 'prompt', () => async (message: string): Promise<string> => {
    if (message.includes('Email')) return Promise.resolve(fakeEmail)
    if (message.includes('Password')) return Promise.resolve(fakePassword)
    return Promise.resolve('')
  })
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)
  .nock(prismicBase, api => {
    return api
    .post('/authentication/signin', `email=${encodeURIComponent(fakeEmail)}&password=${encodeURIComponent(fakePassword)}`)
    .reply(200, {}, {'set-cookie': [fakeCookie]})
  })
  .command(['login'])
  .it('prompts for user name and password')

  test
  .skip()
  .stderr()
  .stdout()
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .nock(prismicBase, api => {
    return api
    .post('/authentication/signin', `email=${encodeURIComponent(fakeEmail)}&password=${encodeURIComponent(fakePassword)}`)
    .reply(500)
  })
  .command(['login', '--email', fakeEmail, '--password', fakePassword])
  .it('when login fails it should notify the user', ctx => {
    expect(ctx.stderr).to.exist
  })

  test
  .stdout()
  .nock(fakeBase, api => {
    return api
    .post('/authentication/signin', `email=${encodeURIComponent(fakeEmail)}&password=${encodeURIComponent(fakePassword)}`)
    .reply(200, {})
  })
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)
  .command(['login', '--email', fakeEmail, '--password', fakePassword, '--base', fakeBase])
  .it('login with no set-cookie response', ctx => {
    expect(fakeWriteFile.getCall(0).args[1]).to.contain('tea').and.to.include('biscuits')
    expect(ctx.stdout).to.contain(fakeBase)
  })
})
