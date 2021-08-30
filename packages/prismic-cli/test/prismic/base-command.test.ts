import {IConfig} from '@oclif/config'
import {expect, test} from '@oclif/test'
import {fs} from '../../src/utils'
import Command from '../../src/prismic/base-command'
import * as sinon from 'sinon'
import * as inquirer from 'inquirer'
class T extends Command {
  async run() {
    return Promise.resolve()
  }
}

describe('prismic/base-command', () => {
  describe('validate repository name', () => {
    const fakeBase = 'https://prismic.io'
    const fakeCookies = 'SESSION=tea; DOMAIN=.prismic.io; X_XSFR=biscuits'
    const config = JSON.stringify({base: fakeBase, cookies: fakeCookies}, null, '\t')
    const repoName = 'fake-repo'

    test
    .stdout()
    .stderr()
    .stub(fs, 'readFileSync', sinon.fake.returns(config))
    .nock(fakeBase, api => {
      return api
      .get('/app/dashboard/repositories/fail/exists').reply(200, () => false)
      .get(`/app/dashboard/repositories/${repoName}/exists`).reply(200, () => true)
    })
    .stub(inquirer, 'prompt', async (): Promise<Record<string, string>> => {
      return Promise.resolve({domain: repoName})
    })
    .add('cmd', () => {
      const opts = {} as IConfig
      return new T([], opts)
    })
    .it('validateDomain', async ctx => {
      const result = await ctx.cmd.validateDomain('fail')
      expect(result).to.equal(repoName)
    })
  })

  test
  .skip()
  .it('validateFolder')

  test
  .skip()
  .it('validateTheme')

  test
  .stub(fs, 'existsSync', () => true)
  .add('cmd', () => {
    const opts = {} as IConfig
    return new T([], opts)
  })
  .it('isLocalZip', ctx => {
    expect(ctx.cmd.isLocalZip('./')).to.be.false
    expect(ctx.cmd.isLocalZip('./tmp.zip')).to.be.true
  })

  test
  .add('cmd', () => {
    const opts = {} as IConfig
    return new T([], opts)
  })
  .it('isAbsoluteUrlToZip', ctx => {
    expect(ctx.cmd.isAbsoluteUrlToZip('https://example.com/fake.zip')).to.be.true
    expect(ctx.cmd.isAbsoluteUrlToZip('https://example.com')).to.be.false
  })

  test
  .add('cmd', () => {
    const opts = {} as IConfig
    return new T([], opts)
  })
  .it('isGithubUrl', ctx => {
    expect(ctx.cmd.isGithubUrl('https://github.com/foo/bar')).to.be.true
    expect(ctx.cmd.isGithubUrl('https://example.com/foo/bar')).to.be.false
  })

  describe('maybeGitHubRepo', () => {
    test
    .add('cmd', () => {
      const opts = {} as IConfig
      return new T([], opts)
    })
    .do(async ctx => {
      const url = 'https://github.com/user/repo/tree/branch'
      const result = await ctx.cmd.maybeGitHubRepo(url)
      expect(result).to.equal('https://github.com/user/repo/archive/branch.zip')
    })
    .it('git url with branch')

    test
    .add('cmd', () => {
      const opts = {} as IConfig
      return new T([], opts)
    })
    .do(async ctx => ctx.cmd.maybeGitHubRepo('https://github.com/user'))
    .catch(error => {
      const message = 'Could not infer github repo from https://github.com/user'
      expect(error.message).to.equal(message)
    })
    .it('will throw en error when it can not guess the repo')

    test
    .add('cmd', () => {
      const opts = {} as IConfig
      return new T([], opts)
    })
    .nock('https://github.com', api => {
      api.head('/prismicio/fake/archive/main.zip').reply(200)
    })
    .it('resolves to master', async ctx => {
      const result = await ctx.cmd.maybeGitHubRepo('https://github.com/prismicio/fake')
      expect(result).to.equal('https://github.com/prismicio/fake/archive/main.zip')
    })

    test
    .add('cmd', () => {
      const opts = {} as IConfig
      return new T([], opts)
    })
    .nock('https://github.com', api => {
      api.head('/prismicio/fake/archive/main.zip').reply(404)
      api.head('/prismicio/fake/archive/master.zip').reply(200)
    })
    .it('resolves to main', async ctx => {
      const result = await ctx.cmd.maybeGitHubRepo('https://github.com/prismicio/fake')
      expect(result).to.equal('https://github.com/prismicio/fake/archive/master.zip')
    })

    test
    .add('cmd', () => {
      const opts = {} as IConfig
      return new T([], opts)
    })
    .nock('https://github.com', api => {
      return api
      .head('/prismicio/fake/archive/main.zip').reply(404)
      .head('/prismicio/fake/archive/master.zip').reply(404)
    })
    .do(async ctx => ctx.cmd.maybeGitHubRepo('https://github.com/prismicio/fake'))
    .catch(error => {
      expect(error.message).to.equal('Could not resolve https://github.com/prismicio/fake/archive/main.zip or https://github.com/prismicio/fake/archive/master.zip')
    })
    .it('throws if not found')

    // TODO: some other error for line 116
  })
})
