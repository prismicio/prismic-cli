import {expect, test} from '@oclif/test'

describe('list', () => {
  test
  .stdout()
  .command(['list'])
  .it('lists local generators', ctx => {
    expect(ctx.stdout).to.contain('Next')
    expect(ctx.stdout).to.contain('Nuxt')
    expect(ctx.stdout).to.contain('React')
    expect(ctx.stdout).to.contain('VueJS')
    expect(ctx.stdout).to.contain('Angular2')
    expect(ctx.stdout).to.contain('NodeJS')
  })
})
