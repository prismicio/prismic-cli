import {
  expect,
  test,
} from '@oclif/test'
import {fs} from '../../src/utils'
import cli from 'cli-ux'
import Signup from '../../src/commands/signup'
import * as server from '../../src/utils/server'
import * as sinon from 'sinon'

describe('signup', () => {
  beforeEach(() => {
    sinon.reset()
  })

  test.it('accepted flags', () => {
    expect(Signup.flags.port).exist
    expect(Signup.flags.base).to.exist
    expect(Signup.flags.base.hidden).to.be.true
    expect(Signup.flags['auth-url']).exist
    expect(Signup.flags['auth-url'].hidden).to.be.true
  })

  const config = JSON.stringify({})

  const fakeServer = sinon.fake.resolves(null)

  test
  .stdout()
  .stub(cli, 'prompt', () => async () => Promise.resolve(''))
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .stub(server, 'startServerAndOpenBrowser', fakeServer)
  .command(['signup'])
  .it('should call startServerAndOpenBrowser with default arguments', () => {
    expect(fakeServer.calledOnce).to.be.true
    expect(fakeServer.called).to.be.true
    const [url, base, port, logAction] = fakeServer.firstCall.args
    expect(url).to.be.equal(`${base}/dashboard/cli/signup?port=${server.DEFAULT_PORT}`)
    expect(base).to.equal(base)
    expect(port).to.equal(server.DEFAULT_PORT)
    expect(logAction).to.include('Signing in')
  })

  test
  .stdout()
  .stub(cli, 'prompt', () => async () => Promise.resolve('q'))
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .stub(server, 'startServerAndOpenBrowser', fakeServer)
  .command(['signup'])
  .it('when user abourts it should not call startServerAndOpenBrowser', () => {
    expect(fakeServer.called).to.be.false
  })

  test
  .stdout()
  .stub(cli, 'prompt', () => async () => Promise.resolve(''))
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .stub(server, 'startServerAndOpenBrowser', fakeServer)
  .command(['signup', '--port', '8080'])
  .it('should call startServerAndOpenBrowser with custom arguments', () => {
    expect(fakeServer.calledOnce).to.be.true
    expect(fakeServer.called).to.be.true
    const [url, base, port, logAction] = fakeServer.firstCall.args
    expect(url).to.be.equal(`${base}/dashboard/cli/signup?port=8080`)
    expect(base).to.equal(base)
    expect(Number(port)).to.equal(8080)
    expect(logAction).to.include('Signing in')
  })
})
