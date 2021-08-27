import {test} from '@oclif/test'
import {fs} from '../../src/utils'

describe.only('create-repo', () => {
  const fakeDomain = 'fake-domain'
  const fakeBase = 'https://prismic.io'
  const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits; prismic-auth=xyz'
  test
  .stub(fs, 'readFileSync', () => JSON.stringify({base: fakeBase, cookies: fakeCookies}))
  .stub(fs, 'writeFile', () => Promise.resolve())
  .nock('https://auth.prismic.io', api => {
    api.get('/validate?token=xyz').reply(200, {})
    api.get('/refreshtoken?token=xyz').reply(200, 'some-token')
  })
  .nock(fakeBase, api => {
    return api
    .get(`/app/dashboard/repositories/${fakeDomain}/exists`).reply(200, () => true)
    .post('/authentication/newrepository?app=slicemachine').reply(200, fakeDomain)
  })
  .command(['create-repo', '--domain', fakeDomain])
  .it('should call login if user is not authenticated and make a repo.')
})
