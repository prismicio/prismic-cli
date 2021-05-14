import {flags} from '@oclif/command'
import env, {meta, filterMetaFor} from '../prismic/yeoman-env'
import Command from '../prismic/base-command'
import * as path from 'path'
import {fs} from '../utils'
import {execSync} from 'child_process'
import {lookpath} from 'lookpath'
import * as inquirer from 'inquirer'

const globby = require('fast-glob')

const {SM_FILE} = require('sm-commons/consts')

export default class Slicemachine extends Command {
  static description = 'Slice Machine Commands'

  static aliases = ['sm']

  static flags = {
    help: flags.help({char: 'h'}),

    force: flags.boolean({char: 'f'}),

    setup: flags.boolean({
      description: 'setup slice machine in an already existing project',
      exclusive: ['create-slice', 'add-storybook', 'list', 'bootstrap', 'develop'],
      default: false,
    }),

    domain: flags.string({
      char: 'd',
      description: 'prismic repo to to create',
      exclusive: ['add-storybook', 'create-slice', 'sliceName', 'library', 'list', 'develop'],
    }),

    'create-slice': flags.boolean({
      description: 'add a slice to a slicemachine project',
      exclusive: ['setup', 'add-storybook', 'list', 'bootstrap', 'develop'],
      default: false,
    }),

    sliceName: flags.string({
      description: 'name of the slice',
      dependsOn: ['create-slice'],
    }),

    library: flags.string({
      description: 'name of the slice library',
      dependsOn: ['create-slice'],
    }),

    'add-storybook': flags.boolean({
      description: 'add storybook to a slicemachine project',
      exclusive: ['setup', 'create-slice', 'list', 'bootstrap', 'develop'],
      default: false,
    }),

    framework: flags.string({
      options: ['nextjs', 'nuxt'],
    }),

    list: flags.boolean({
      description: 'list local slices',
      exclusive: ['add-storybook', 'setup', 'create-slice', 'bootstrap', 'sliceName', 'domain', 'library', 'framework', 'folder', 'skip-install', 'develop'],
      default: false,
    }),

    folder: flags.string({
      description: 'output directory',
    }),

    'skip-install': flags.boolean({
      description: 'prevent npm install from running',
      exclusive: ['create-slice', 'list', 'bootstrap'],
      default: false,
    }),

    bootstrap: flags.boolean({
      description: 'reconfigure a slicemachine project',
      exclusive: ['setup', 'create-slice', 'list', 'develop'],
      default: false,
    }),

    develop: flags.boolean({
      description: 'run slice machine',
      exclusive: ['setup', 'create-slice', 'list', 'bootstrap'],
      default: false,
    }),

    customTypeEndpoint: flags.string({
      description: 'use a different custom-type endpoint',
      hidden: true,
      dependsOn: ['develop'],
      // default: 'https://silo2hqf53.execute-api.us-east-1.amazonaws.com/prod/slices',
    }),
  }

  private async readGeneratorsFromToRc(folder: string): Promise<Array<string>> {
    const pathToYoRc = path.join(folder, '.yo-rc.json')
    const hasYoRc = fs.existsSync(pathToYoRc)

    if (!hasYoRc) return Promise.resolve([])

    const YoRc: Record<string, any> = JSON.parse(fs.readFileSync(pathToYoRc, 'utf-8'))
    const generatorNames = Object.keys(YoRc)
    .filter(d => d.startsWith('generator-prismic-'))
    .map(d => d.replace(/^generator-/, ''))

    return Promise.resolve(generatorNames)
  }

  async maybePromptForFrameWork(frameworksInYoRc: Array<string>, subGeneratorName: string): Promise<string> {
    const choices = (frameworksInYoRc.length === 0) ? (
      this.posibleFrameWorksForSubGeneratorAsPromtps(subGeneratorName)
    ) : frameworksInYoRc.map(d => ({name: d.replace(/^prismic-/, ''), value: d}))

    return inquirer.prompt<{framework: string}>({
      type: 'list',
      choices,
      name: 'framework',
      message: 'Which framework to use',
    }).then(res => res.framework)
  }

  private posibleFrameWorksForSubGeneratorAsPromtps(subGeneratorName: string) {
    const generatorsWithSubGenerators = filterMetaFor(meta, subGeneratorName)
    return Object.values(generatorsWithSubGenerators).map(d => {
      const name = d.namespace.replace(/^prismic-/, '')
      const value = d.namespace
      return {name, value}
    })
  }

  private async runSubGenerator(name: string, folder: string, opts: Record<string, any>) {
    return this.readGeneratorsFromToRc(folder)
    .then(res => {
      if (res.length === 0 || res.length > 1) return this.maybePromptForFrameWork(res, name)
      return res[0]
    })
    .then(framework => {
      const setup = `${framework}:${name}`
      return this.envRun(setup, opts)
    })
  }

  private async handleSetup(folder: string, opts: Record<string, any>) {
    return this.runSubGenerator('slicemachine', folder, opts)
  }

  private async handleCreateSlice(folder: string, opts: Record<string, any>) {
    return this.runSubGenerator('create-slice', folder, opts)
  }

  private async handleStorybook(folder: string, opts: Record<string, any>) {
    return this.runSubGenerator('storybook', folder, opts)
  }

  async envRun(generatorName: string, options: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      return env.run(generatorName, options, err => {
        if (err) return reject(err)
        return resolve()
      })
    })
  }

  async run() {
    const {flags} = this.parse(Slicemachine)

    const folder = flags.folder || process.cwd()

    const opts = {...flags, prismic: this.prismic, path: folder}

    if (flags['create-slice']) {
      return this.handleCreateSlice(folder, opts)
    }

    if (flags['add-storybook']) {
      return this.handleStorybook(folder, opts)
    }

    if (flags.setup) {
      const domain = await this.validateDomain(flags.domain)
      const isAuthenticated = await this.prismic.isAuthenticated()
      if (!isAuthenticated) {
        await this.login()
      }

      return this.handleSetup(folder, {...opts, domain})
    }

    if (flags.list) {
      const pathToSMFile = path.join(folder, SM_FILE)
      if (fs.existsSync(pathToSMFile) === false) {
        this.error(`Could not find ${SM_FILE} at: ${pathToSMFile}`)
      }

      return fs.readFile(pathToSMFile, 'utf-8')
      .then(JSON.parse)
      .then(json => json.libraries || [])
      .then((libs: Array<string>) => {
        libs.forEach((lib: string) => {
          const isLocal = lib.startsWith('@/') || lib.startsWith('~') || lib.startsWith('/')
          const pathToSlices = path.posix.join(
            folder,
            isLocal ? '.' : 'node_modules',
            isLocal ? lib.substring(1, lib.length) : lib,
            '**',
            'model.json',
          )

          const pathToModels: Array<string> = globby.sync(pathToSlices)
          const names = pathToModels.map(pathToModel => {
            const dir = path.dirname(pathToModel)
            const dirs = dir.split(path.sep)
            return dirs[dirs.length - 1]
          })

          this.log(lib)
          names.forEach(name => this.log('\t' + name))
        })
      })
      .catch(this.error)
    }

    if (flags.bootstrap) {
      const smFilePath = path.join(folder, SM_FILE)

      if (fs.existsSync(smFilePath) === false) {
        return this.warn(`${SM_FILE} file not found in: ${smFilePath}`)
      }

      const isAuthenticated = await this.prismic.isAuthenticated()
      if (!isAuthenticated) {
        await this.login()
      }

      const domain = await this.validateDomain(flags.domain)

      return this.prismic.createRepository({domain})
      .then(res => {
        const url = new URL(this.prismic.base)
        url.hostname = `${res.data}.${url.hostname}`
        return this.log(`Your SliceMachine repository was successfully created! ${url.toString()}`)
      })
      .then(() => fs.readFile(smFilePath, 'utf-8'))
      .then(str => JSON.parse(str))
      .then(json => {
        const url = new URL(this.prismic.base)
        url.hostname = `${domain}.cdn.${url.hostname}`
        url.pathname = 'api/v2'
        return JSON.stringify({...json, apiEndpoint: url.toString()}, null, 2)
      }).then(smFile => {
        return fs.writeFile(smFilePath, smFile)
      })
    }

    if (flags.develop) {
      const isAuthenticated = await this.prismic.isAuthenticated()
      if (!isAuthenticated) await this.login()

      this.checkIsInASlicemachineProject()

      const hasYarn = await lookpath('yarn')
      const usingYarn = fs.existsSync(path.join(process.cwd(), 'yarn.lock'))
      const pm = hasYarn && usingYarn ? 'yarn' : 'npm run'
      return execSync(`${pm} slicemachine`, {stdio: 'inherit'})
    }

    if (!flags['create-slice'] && !flags['add-storybook'] && !flags.setup && !flags.list) {
      return this._help()
    }
  }

  private checkIsInASlicemachineProject(): string {
    const pathToSMFile = path.join(process.cwd(), SM_FILE)

    if (fs.existsSync(pathToSMFile) === false) {
      this.warn(`[slice-machine] Could not find ${pathToSMFile}`)
      return this.exit()
    }

    const smFile = fs.readFileSync(pathToSMFile, 'utf-8')
    try {
      const apiEndpoint: string = JSON.parse(smFile).apiEndpoint
      const url = new URL(apiEndpoint)
      return url.hostname.split('.')[0]
    } catch {
      this.warn(`[slice-machine] No "apiEndpoint" value found in ${pathToSMFile} .\nIn order to run this command, you need to set a Prismic repository endpoint`)
      return this.exit()
    }
  }
}
