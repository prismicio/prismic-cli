import {expect, test} from '@oclif/test'

describe.skip('create-slice', () => {
  test
  .stdout()
  .command(['create-slice'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['create-slice', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
