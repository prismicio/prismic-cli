import {expect, test} from '@oclif/test'
import Logout from '../../src/commands/logout'
import * as sinon from 'sinon'

import {fs} from '../../src/utils'

describe('logout', () => {
  test.it('lgout flags', () => {
    expect(Logout.flags.help).exist
  })

  const fakeUnlink = sinon.fake.resolves(null)
  test
  .stdout()
  .stub(fs, 'unlink', fakeUnlink)
  .command(['logout'])
  .do(ctx => {
    expect(fakeUnlink.called)
    expect(ctx.stdout).to.contain('Logged out')
  })
  .it('runs logout')
})
