import {expect, test} from '@oclif/test'

import * as semver from 'semver'

const libnpmconfig = require('libnpmconfig')

const pjson = require('../../package.json')

describe('hooks', () => {
  test
  .stdout()
  .stderr()
  .stub(libnpmconfig, 'read', () => ({}))
  .nock('https://registry.npmjs.org/', api => {
    api.get('/prismic-cli').reply(200, {'dist-tags': {latest: pjson.version}})
  })
  .hook('postrun')
  .do(ctx => {
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.equal('')
  })
  .it('update hook: should not log anything if the user is using the most recent version')

  test
  .stdout()
  .stderr()
  .stub(libnpmconfig, 'read', () => ({}))
  .nock('https://registry.npmjs.org/', api => {
    api.get('/prismic-cli').reply(200, {'dist-tags': {latest: semver.inc(pjson.version, 'patch')}})
  })
  .hook('postrun')
  .do(ctx => {
    expect(ctx.stdout).to.include('A new version of prismic-cli is available!')
    expect(ctx.stderr).to.equal('')
  })
  .it('update hook: inform the user about a more recent version being available is using the most recent version')

  test
  .stdout()
  .stderr()
  .stub(libnpmconfig, 'read', () => ({registry: 'https://registry.npmjs.org/'}))
  .nock('https://registry.npmjs.org/', api => {
    api.get('/prismic-cli').reply(200, {'dist-tags': {latest: pjson.version}})
  })
  .hook('postrun')
  .do(ctx => {
    expect(ctx.stdout).to.include('')
    expect(ctx.stderr).to.equal('')
  })
  .it('update hook: will use a configured npm-registry')

  test
  .skip()
  .stdout()
  .stderr()
  .stub(libnpmconfig, 'read', () => ({registry: 'https://registry.npmjs.org/'}))
  .nock('https://registry.npmjs.org/', api => {
    api.get('/prismic-cli-2').reply(200, {'dist-tags': {latest: pjson.version}})
  })
  .hook('postrun', {config: {pjson: {name: 'prismic-cli-2', version: semver.inc(pjson.version, 'patch')}}})
  .do(ctx => {
    expect(ctx.stdout).to.include('')
    expect(ctx.stderr).to.equal('')
  })
  .it('update hook: uses package version and name provided in options option by oclif')
})
