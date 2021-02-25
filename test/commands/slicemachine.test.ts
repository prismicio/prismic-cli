import {expect, test} from '@oclif/test'

describe.skip('slicemachine', () => {
  test
  .stdout()
  .command(['slicemachine'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['slicemachine', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
