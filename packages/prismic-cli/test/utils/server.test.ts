import {test, expect} from '@oclif/test'
import {Server, Routes} from '../../src/utils/server'
import * as sinon from 'sinon'

describe('server', () => {
  const server = Server.build('https://prismic.io', 5555, 'localhost')
  const fakeCallback = sinon.fake()
  server.route([Routes.authentication(server)(fakeCallback), Routes.notFound])

  beforeEach(async () => {
    await server.initialize()
    fakeCallback.resetHistory()
  })

  afterEach(async () => {
    await server.stop()
  })
  test.it('returns a 404 for all other methods', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/random',
    })
    expect(res.statusCode).to.equal(404)
    expect(res.payload).to.equals('not found: [get]: http://localhost:5555/random')
  })

  test.it('Valid authentication POST request', async () => {
    const fakeCookie = ['SESSION=session-token', 'prismic-auth=auth-token']
    const fakeEmail = 'batman@example.com'

    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {
        email: fakeEmail,
        cookies: fakeCookie,
      },
    })

    expect(res.statusCode).to.equal(200)
    expect(fakeCallback.called, 'onSuccess should be called').to.be.true
    expect(fakeCallback.args[0], 'callback should be called with correct args').to.deep.equal([{cookies: fakeCookie, email: fakeEmail}])
  })

  test.it('handles invalid POST request - empty payload', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {},
    })

    expect(res.statusCode).to.equal(400)
    expect(fakeCallback.called, 'onSuccess should be called').to.be.false
  })

  test.it('handles invalid POST request - invalid cookies format', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/',
      payload: {
        email: 'fake',
        cookies: true,
      },
    })

    expect(res.statusCode).to.equal(400)
    expect(fakeCallback.called, 'onSuccess should be called').to.be.false
  })
})

//   it('handles valid POST request', () => {
//     const setHeader = sinon.fake()
//     const end = sinon.fake.yields()
//     const fakeStart = sinon.fake()
//     const fakeStop = sinon.fake()
//     const res = {setHeader, end} as unknown as ServerResponse

//     const req = new Req('POST') as IncomingMessage

//     const fakeCallBack = sinon.fake()
//     const base = 'https://prismic.io'
//     const logAction = 'test'
//     const fakeCookie = 'SESSION=session-token; prismic-auth=auth-token; Path=/; Domain=.prismic.io; Secure; SameSite=None'
//     const fakeEmail = 'batman@example.com'

//     const startStub = sinon.stub(cli.action, 'start').callsFake(fakeStart)
//     const stopStub = sinon.stub(cli.action, 'stop').callsFake(fakeStop)

//     handleRequest(base, logAction, fakeCallBack)(req, res)
//     req.emit('data', JSON.stringify({cookies: fakeCookie, email: fakeEmail}))
//     req.emit('end')
//     expect(fakeStart.called, 'cli.action.start should be called').to.be.true
//     //  expect(fakeStop.called, 'cli.action.stop should be called').to.be.true
//     expect(end.called, 'res.end should be called').to.be.true
//     expect(res.statusCode).to.equal(200)
//     expect(fakeCallBack.called, 'callback should be called').to.be.true
//     expect(fakeCallBack.args[0], 'callback should be called with correct args').to.deep.equal([null, {cookies: fakeCookie, email: fakeEmail}])

//     startStub.reset()
//     stopStub.reset()
//   })

//   it('handles invalid POST request', () => {
//     const setHeader = sinon.fake()
//     const end = sinon.fake()
//     const res = {setHeader, end} as unknown as ServerResponse

//     const req = new Req('POST') as IncomingMessage

//     const fakeCallBack = sinon.fake()
//     const base = 'https://prismic.io'
//     const logAction = 'test'

//     handleRequest(base, logAction, fakeCallBack)(req, res)
//     req.emit('data', JSON.stringify({}))
//     req.emit('end')

//     expect(end.called).to.be.true
//     expect(res.statusCode).to.equal(400)
//     expect(fakeCallBack.called).to.be.false
//   })
// })

// describe('server', () => {
//   beforeEach(() => {
//     sinon.reset()
//   })

//   const fakeStart = sinon.fake()
//   const fakeStop = sinon.fake()
//   const fakeOpen = sinon.fake.resolves(null)

//   const fakeSetCookiesSuccess = sinon.fake.resolves(null)

//   class FakeServer extends EventEmitter  {
//     listen = sinon.fake.yields(this)

//     close = sinon.fake()
//   }

//   const fakeHttpServer = new FakeServer()

//   test
//   .stub(cli, 'open', () => fakeOpen)
//   .stub(cli.action, 'start', fakeStart)
//   .stub(cli.action, 'stop', fakeStop)
//   .stub(cli, 'log', sinon.fake())
//   .stub(http, 'createServer', () => fakeHttpServer)
//   .it('startServerAndOpenBrowser success case', async (_, done) => {
//     server('https://prismic.io/test', 'https://prismic.io', 5555, 'logActions', fakeSetCookiesSuccess)
//     fakeHttpServer.emit('data', JSON.stringify({cookies: 'foo', email: 'test@example.com'}))
//     fakeHttpServer.emit('end')

//     expect(fakeHttpServer.listen.firstCall.args[0]).to.equal(5555)
//     expect(fakeStart.called, 'should call cli.action.start').to.be.true
//     // expect(fakeStop.called, 'should call cli.action.stop').to.be.true
//     expect(fakeOpen.called, 'should call cli.open').to.be.true
//     expect(fakeOpen.firstCall.args, 'should open the prvided url').to.contain('https://prismic.io/test')
//     // expect(fakeSetCookiesSuccess.called).to.be.true
//     // expect(fakeStart.firstCall.args[0]).to.equal('logActions')
//     done()
//   })

//   // const catchFn = sinon.fake()

//   test
//   .stub(cli, 'open', () => fakeOpen)
//   .stub(cli.action, 'start', fakeStart)
//   .stub(cli.action, 'stop', fakeStop)
//   .stub(cli, 'log', sinon.fake())
//   .stub(http, 'createServer', () => fakeHttpServer)
//   .stderr()
//   .it('startServerAndOpenBrowser error case', async (ctx, done) => {
//     server('https://prismic.io/test', 'https://prismic.io', 5555, 'logActions', () => Promise.resolve())
//     fakeHttpServer.emit('error', 'foo')
//     expect(fakeStop.called, 'cli.action.stop should be called').to.be.true
//     expect(fakeHttpServer.close.called, 'server.close should be called').to.be.true
//     expect(ctx.stderr, 'sdterr should contain error message').to.contain('foo')
//     // expect(catchFn.called, 'server promise should reject').to.be.true
//     done()
//   })
// })
