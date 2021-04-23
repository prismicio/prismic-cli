import {fancy} from 'fancy-test'
import {expect} from 'chai'
import Generator, {TemplateOptions, Documents} from '../src'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import type Prismic from 'prismic-cli/lib/prismic/communication'
import * as lookpath from 'lookpath'
import * as sinon from 'sinon'

import * as cli from 'cli-ux'

import {ObjectWritableMock} from 'stream-mock'

import {Theme as fakeTheme} from './__stubs__'

describe('prismic-yeoman-generator', () => {
  const generator = () => {
    class Gen extends Generator {}
    const options: TemplateOptions = {
      domain: 'test',
      prismic: {} as Prismic,
      force: false,
      path: path.join(os.tmpdir(), 'prismic-yeoman-generator-test'),
    }
    return new Gen([], options)
  }

  describe('promptForPackageManager', () => {
    fancy
    .add('generator', generator)
    .stub(lookpath, 'lookpath', async () => false)
    .do(async ctx => {
      const result = await ctx.generator.promptForPackageManager()
      expect(result).to.equal('npm')
      expect(ctx.generator.pm).to.equal('npm')
    })
    .it('will default to npm if yarn is not installed')

    fancy
    .add('generator', generator)
    .stub(lookpath, 'lookpath', async () => true)
    .stub(fs, 'existsSync', () => true)
    .do(async ctx => {
      const result = await ctx.generator.promptForPackageManager()
      expect(result).to.equal('yarn')
      expect(ctx.generator.pm).to.equal('yarn')
    })
    .it('will default to yarn if the user has yarn installed and there is a yarn.lock file in te project')

    fancy
    .add('generator', () => {
      const gen = generator()
      gen.prompt = async () => Promise.resolve({pm: 'yarn'}) as Promise<any>
      return gen
    })
    .stub(lookpath, 'lookpath', async () => true)
    .stub(fs, 'existsSync', () => false)
    .do(async ctx => {
      const result = await ctx.generator.promptForPackageManager()
      expect(result).to.equal('yarn')
      expect(ctx.generator.pm).to.equal('yarn')
    })
    .it('will promppt the user to select a package manager is yarn is installed but no yarn.lock file is found')
  })

  describe('innerFolderFromGitRepo', () => {
    const url = 'https://github.com/prismicio/fake-theme/master.zip'
    fancy
    .add('generator', generator)
    .do(ctx => {
      const result = ctx.generator.innerFolderFromGitRepo(url)
      expect(result).to.equal('fake-theme-master')
    })
    .it('should infer the inner folder from the url to the zip file of github repo')
  })

  describe('readDocumentsFrom', () => {
    fancy
    .add('generator', () => {
      const g = generator()
      g.fs.exists = () => false
      return g
    })
    .do(ctx => {
      const result = ctx.generator.readDocumentsFrom()
      expect(result).to.be.undefined
    })
    .it('should return undefined if the documents director does not exist')

    fancy
    .add('generator', () => {
      const g = generator()
      const project =  path.resolve(__dirname, './__stubs__/fake-theme-master')
      g.destinationRoot(g.path)
      g.fs.copy(project, g.path)
      return g
    })
    .do(ctx => {
      const result = ctx.generator.readDocumentsFrom('documents') as Documents
      expect(result).not.to.be.undefined
      expect(result.signature).not.to.be.undefined
      expect(result.signature).to.equal('34fbecc5b263e17dba2cd597119489a17b7343d6')
      expect(result.documents).not.to.be.undefined
      expect(Object.keys(result.documents).length).to.be.greaterThan(0)
    })
    .it('should read the singnature and documents from a theme')
  })

  describe('readCustomTypesFrom', () => {
    fancy
    .add('generator', () => {
      const g = generator()
      const project =  path.resolve(__dirname, './__stubs__/fake-theme-master')
      g.destinationRoot(g.path)
      g.fs.copy(project, g.path)
      return g
    })
    .do(ctx => {
      const result = ctx.generator.readCustomTypesFrom()
      expect(result.length).to.be.greaterThan(0)
    })
    .it('should read the custom-types from a theme')
  })

  describe('downloadAndExtractZipFrom', () => {
    const zip = fakeTheme.toBuffer()
    const source = 'https://github.com/prismicio/fake-theme/archive/master.zip'

    fancy
    .add('generator', () => {
      const g = generator()
      g.destinationRoot(g.path)
      return g
    })
    .nock('https://github.com', api => {
      return api.get('/prismicio/fake-theme/archive/master.zip')
      .reply(200, zip, {
        'Content-Type': 'application/zip',
        'content-length': zip.length.toString(),
      })
    })
    .do(async ctx => {
      const result = await ctx.generator.downloadAndExtractZipFrom(source)
      expect(result.existsDestination('fake-theme-master/prismic-configuration.js')).to.be.true
    })
    .it('should download a zip file from the source and extract it to mem-fs')

    fancy
    .add('generator', () => {
      const g = generator()
      g.destinationRoot(g.path)
      return g
    })
    .nock('https://github.com', api => {
      return api.get('/prismicio/fake-theme/archive/master.zip')
      .reply(200, zip, {
        'Content-Type': 'application/zip',
        'content-length': zip.length.toString(),
      })
    })
    .do(async ctx => {
      await ctx.generator.downloadAndExtractZipFrom(source, 'fake-theme-master')
      expect(ctx.generator.existsDestination('prismic-configuration.js')).to.be.true
    })
    .it('should download extract the inner folder from the zip-file')

    const fakeProgress = {
      start: sinon.fake(),
      stop: sinon.fake(),
    }

    fancy
    .stub(cli, 'progress', () => fakeProgress)
    .add('generator', () => {
      const g = generator()
      g.destinationRoot(g.path)
      return g
    })
    .nock('https://github.com', api => {
      return api.get('/prismicio/fake-theme/archive/master.zip')
      .reply(200, zip, {
        'Content-Type': 'application/zip',
        'content-length': '',
      })
    })
    .do(async ctx => {
      const result = await ctx.generator.downloadAndExtractZipFrom(source, 'fake-theme-master')
      expect(result.existsDestination('prismic-configuration.js')).to.be.true
      expect(fakeProgress.start.notCalled).to.be.true
      expect(fakeProgress.stop.notCalled).to.be.true
    })
    .it('should show a progress bar if content-length is given')

    fancy
    .add('generator', () => {
      const g = generator()
      g.destinationRoot(g.path)
      return g
    })
    .stub(fs, 'createWriteStream', () => {
      const ws = new ObjectWritableMock()
      ws.once('finish', () => {
        ws.emit('error', new Error('whoops'))
      })
      return ws
    })
    .nock('https://github.com', api => {
      return api.get('/prismicio/fake-theme/archive/master.zip')
      .reply(200, zip, {
        'Content-Type': 'application/zip',
        'content-length': zip.length.toString(),
      })
    })
    .do(async ctx => ctx.generator.downloadAndExtractZipFrom(source))
    .catch('whoops')
    .it('should throw an error if download fails')
  })
})
