import {expect, test} from '@oclif/test'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import * as inquirer from 'inquirer'
import CreateGenerator from '../../src/commands/create-generator'

describe('create-generator', () => {
  const tmpDir = os.tmpdir()
  const jsDir = path.join(tmpDir, 'js-generator-test')
  const tsDir = path.join(tmpDir, 'ts-generator-test')
  before(() => {
    rimraf.sync(jsDir)
    rimraf.sync(tsDir)
  })

  test.it('flags', () => {
    expect(CreateGenerator.flags.folder).to.exist
    expect(CreateGenerator.flags.force).to.exist
    expect(CreateGenerator.flags.help).exist
    expect(CreateGenerator.flags.language).to.exist
    expect(CreateGenerator.flags.name).to.exist
    expect(CreateGenerator.flags.pm).to.exist
    expect(CreateGenerator.flags['skip-install']).to.exist
    expect(CreateGenerator.flags.language.parse('js', {})).to.equal('javascript')
    expect(CreateGenerator.flags.language.parse('ts', {})).to.equal('typescript')
    expect(CreateGenerator.flags.language.parse('jts', {})).to.equal('jts') // unlikely to happen
  })

  test
  .stdout()
  .stderr()
  .stub(inquirer, 'prompt', () => Promise.resolve({slicemachine: true}))
  .command(['create-generator', '--pm', 'npm', '--language', 'js', '--name', 'js-test', '--folder', jsDir, '--skip-install', '--force'])
  .it('setups a JavaSript based generator', () => {
    const outDir = path.join(jsDir, 'generator-prismic-js-test')
    expect(fs.existsSync(path.join(outDir, 'package.json'))).to.be.true
  })

  test
  .stdout()
  .stderr()
  .stub(inquirer, 'prompt', () => Promise.resolve({slicemachine: true}))
  .command(['create-generator', '--pm', 'npm', '--language', 'js', '--name', 'ts-test', '--folder', tsDir, '--skip-install', '--force'])
  .it('setups a TypeScript based generator', () => {
    const outDir = path.join(tsDir, 'generator-prismic-ts-test')
    expect(fs.existsSync(outDir)).to.be.true
  })
})
