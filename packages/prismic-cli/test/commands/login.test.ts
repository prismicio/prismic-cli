import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'
import {fs} from '../../src/utils'
import cli from 'cli-ux'
import Login from '../../src/commands/login'
import * as server from '../../src/utils/server'

describe('login', () => {
  beforeEach(() => {
    sinon.reset()
  })

  test
  .it('login flags', () => {
    expect(Login.flags.port).exist
    expect(Login.flags.base).exist
    expect(Login.flags.base.hidden).to.be.true
    expect(Login.flags['auth-url']).exist
    expect(Login.flags['auth-url'].hidden).to.be.true
  })

  const prismicBase = 'https://prismic.io'
  const fakeErrorFileNotFound = new Error()
  Object.assign(fakeErrorFileNotFound, {code: 'ENOENT'})
  const fakeReadFileSync = sinon.fake.returns(JSON.stringify({}))
  const fakeWriteFile = sinon.fake.resolves(null)

  const fakeServer = sinon.fake.resolves(null)

  test
  // .stdout()
  .stub(cli, 'prompt', () => async () => Promise.resolve(''))
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)
  .stub(server, 'startServerAndOpenBrowser', fakeServer)
  .command(['login'])
  .it('login should call startServerAndOpenBrowser with default parameters', _ => {
    expect(fakeServer.called).to.be.true
    const [url, base, port, logAction] = fakeServer.firstCall.args
    expect(url).to.be.equal(`${prismicBase}/dashboard/cli/login?port=${server.DEFAULT_PORT}`)
    expect(base).to.equal(prismicBase)
    expect(port).to.equal(server.DEFAULT_PORT)
    expect(logAction).to.include('Logging in')
  })

  const fakeBase = 'https://example.com'

  test
  .stderr()
  .stdout()
  .stub(cli, 'prompt', () => async () => Promise.resolve(''))
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)
  .stub(server, 'startServerAndOpenBrowser', fakeServer)
  .command(['login', '--base', fakeBase, '--port', '8080'])
  .it('login with base and auth-url parameters', _ => {
    expect(fakeServer.called).to.be.true
    const [url, base, port, logAction] = fakeServer.firstCall.args
    expect(url).to.be.equal(`${fakeBase}/dashboard/cli/login?port=8080`)
    expect(base).to.equal(fakeBase)
    expect(port).to.equal(8080)
    expect(logAction).to.include('Logging in')
  })

  test
  .stderr()
  .stdout()
  .stub(cli, 'prompt', () => async () => Promise.resolve('q'))
  .stub(fs, 'readFileSync', fakeReadFileSync)
  .stub(fs, 'writeFile', fakeWriteFile)
  .stub(server, 'startServerAndOpenBrowser', fakeServer)
  .command(['login'])
  .it('user can quit login process', _ => {
    expect(fakeServer.called).to.be.false
  })
})
