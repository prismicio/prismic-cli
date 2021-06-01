import {expect, test} from '@oclif/test'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as rimraf from 'rimraf'

describe('create-generator', () => {
  const tmpDir = os.tmpdir()
  const jsDir = path.join(tmpDir, 'js-generator-test')
  const tsDir = path.join(tmpDir, 'ts-generator-test')
  before(() => {
    rimraf.sync(jsDir)
    rimraf.sync(tsDir)
  })

  test
  .command(['create-generator', '--pm', 'npm', '--language', 'js', '--name', 'js-test', '--path', jsDir, '--skip-install', '--force'])
  .do(async () => {
    const outDir = path.join(jsDir, 'js-test')
    expect(fs.existsSync(path.join(outDir, 'package.json'))).to.be.true
  })
  .it('setups a JavaSript based generator')

  test
  .command(['create-generator', '--pm', 'npm', '--language', 'js', '--name', 'ts-test', '--path', tsDir, '--skip-install', '--force'])
  .do(async () => {
    const outDir = path.join(tsDir, 'ts-test')
    expect(fs.existsSync(outDir)).to.be.true
  })
  .it('setups a TypeScript based generator')
})
