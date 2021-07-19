import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'

describe('whoami', () => {
  const fakeBase = 'https://prismic.io'
  const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'

  test
  .stdout()
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock('https://auth.prismic.io', api => {
    api.get('/validate?token=xyz').reply(200, {
      email: 'fake.user@prismic.io',
      type: 'USER',
      repositories: {},
    })
  })
  .command('whoami')
  .it('When logged in it should show the user their user name', ctx => {
    expect(ctx.stdout).to.contain('fake.user@prismic.io')
  })

  test
  .stdout()
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock('https://auth.prismic.io', api => {
    api.get('/validate?token=xyz').reply(401, 'One or more parameter values are not valid. The AttributeValue for a key attribute cannot contain an empty string value. Key: token')
  })
  .command('whoami')
  .it('Should tell the user they are not logged in', ctx => {
    expect(ctx.stdout).to.contain('Not logged in')
  })
})
