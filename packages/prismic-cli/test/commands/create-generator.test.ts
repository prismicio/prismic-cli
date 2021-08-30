import {expect, test} from '@oclif/test'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as rimraf from 'rimraf'
import * as inquirer from 'inquirer'

describe('create-generator', () => {
  const tmpDir = os.tmpdir()
  const jsDir = path.join(tmpDir, 'js-generator-test')
  const tsDir = path.join(tmpDir, 'ts-generator-test')
  before(() => {
    rimraf.sync(jsDir)
    rimraf.sync(tsDir)
  })

  test
  .stderr()
  .stub(inquirer, 'prompt', () => Promise.resolve({slicemachine: true}))
  .command(['create-generator', '--pm', 'npm', '--language', 'js', '--name', 'js-test', '--path', jsDir, '--skip-install', '--force'])
  .it('setups a JavaSript based generator', () => {
    const outDir = path.join(jsDir, 'generator-prismic-js-test')
    expect(fs.existsSync(path.join(outDir, 'package.json'))).to.be.true
  })

  test
  .stderr()
  .stub(inquirer, 'prompt', () => Promise.resolve({slicemachine: true}))
  .command(['create-generator', '--pm', 'npm', '--language', 'js', '--name', 'ts-test', '--path', tsDir, '--skip-install', '--force'])
  .it('setups a TypeScript based generator', () => {
    const outDir = path.join(tsDir, 'generator-prismic-ts-test')
    expect(fs.existsSync(outDir)).to.be.true
  })
})
