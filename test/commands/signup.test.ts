import {
  expect,
  test,
} from '@oclif/test'
import {fs} from '../../src/utils'
import * as querystring from 'querystring'
import cli from 'cli-ux'
import Signup from '../../src/commands/signup'

describe('signup', () => {
  test.it('accepted flags', () => {
    expect(Signup.flags.base).to.exist
    expect(Signup.flags.base.hidden).to.be.true
    expect(Signup.flags.email).to.exist
    expect(Signup.flags.password).to.exist
  })

  const email = 'email'
  const password = 'password'
  const base = 'https://prismic.io'
  const config = JSON.stringify({base, cookies: ''})

  const fakeCookies = [
    'SESSION=session-token',
    'prismic-auth=auth-token; Path=/; Domain=.prismic.io; Secure; SameSite=None',
  ]

  const query = querystring.stringify({ml: true, email, password})

  test
  .stdout()
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(base, api => {
    return api.post('/authentication/signup?' + query)
    .reply(200, {}, {
      'set-cookie': fakeCookies,
    })
  })
  .command(['signup', '--email', email, '--password', password, '--base', base])
  .it('should create an new prismic account')

  test
  .stdout()
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .stub(cli, 'prompt', () => async (message: string): Promise<string> => {
    if (message.includes('Email')) return Promise.resolve(email)
    if (message.includes('Password')) return Promise.resolve(password)
    return Promise.resolve('')
  })
  .nock(base, api => {
    return api.post('/authentication/signup?' + query)
    .reply(200, {}, {
      'set-cookie': fakeCookies,
    })
  })
  .command(['signup'])
  .it('prompts for email and password')

  // Error cases
  test
  .stdout()
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(base, api => {
    return api.post('/authentication/signup?' + query)
    .reply(400, {
      errors: [`User ${email} already exists`],
    }, {
    })
  })
  .command(['signup', '--email', email, '--password', password, '--base', base])
  .it('should handle errors', ctx => {
    expect(ctx.stdout).to.contain(`User ${email} already exists`)
  })

  test
  .stdout()
  .stderr()
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(base, api => {
    return api.post('/authentication/signup?' + query)
    .reply(400)
  })
  .command(['signup', '--email', email, '--password', password, '--base', base])
  .it('should handle errors', ctx => {
    expect(ctx.stderr).to.exist
  })
})
