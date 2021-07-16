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

  const email = 'test@prismic.io'
  const password = 'password'
  const base = 'https://prismic.io'
  const config = JSON.stringify({base, cookies: ''})

  const fakeCookies = [
    'SESSION=session-token',
    'prismic-auth=auth-token; Path=/; Domain=.prismic.io; Secure; SameSite=None',
  ]

  const query = querystring.stringify({email, password})

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

  // validators
  test
  .stderr()
  .stdout()
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .stub(cli, 'prompt', () => async (message: string): Promise<string> => {
    if (message.includes('Email')) return Promise.resolve(email)
    if (message.includes('Password')) return Promise.resolve(password)
    return Promise.resolve('')
  })
  .command(['signup', '--email', 'fails', '--password', 'fails'])
  .it('should validate password an email inputs', ctx => {
    expect(ctx.stderr).to.contain('Enter a valid email address')
    expect(ctx.stderr).to.contain('Enter a longer password (minimum 6 characters)')
  })

  // Error cases
  test
  .stdout()
  .stderr()
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
    expect(ctx.stderr).to.contain(`User ${email} already exists`)
  })

  test
  .stdout()
  .stderr()
  .stub(fs, 'readFileSync', () => config)
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock(base, api => {
    return api.post('/authentication/signup?' + query)
    .reply(400, {
      errors: {
        password: ['This field is required'],
        email: ['This field is required'],
      },
    })
  })
  .command(['signup', '--email', email, '--password', password, '--base', base])
  .it('handle error response from prismic.io', ctx => {
    expect(ctx.stderr).to.contain('email: This field is required').and.to.contain('password: This field is required')
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
