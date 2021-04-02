import {flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'
import Command from '../prismic/base-command'
import * as path from 'path'
import {fs} from '../utils'
import * as cookie from '../utils/cookie'
import {execSync} from 'child_process'
import {lookpath} from 'lookpath'

const globby = require('fast-glob')

const {SM_FILE} = require('sm-commons/consts')

export default class Slicemachine extends Command {
  static description = 'Slice Machine Commands'

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
      options: ['next', 'nuxt'],
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

  async run() {
    const env = createEnv()
    env.register(require.resolve('../generators/slicemachine/setup'), 'setup')
    env.register(require.resolve('../generators/slicemachine/create-slice'), 'create-slice')
    env.register(require.resolve('../generators/slicemachine/storybook'), 'storybook')

    const {flags} = this.parse(Slicemachine)

    const folder = flags.folder || process.cwd()

    const opts = {...flags, prismic: this.prismic, path: folder}

    if (flags['create-slice']) {
      return new Promise((resolve, reject) => {
        env.run('create-slice', opts, (err: Error | null) => {
          if (err) return reject(err)
          return resolve(undefined)
        })
      })
    }

    if (flags['add-storybook']) {
      return new Promise((resolve, reject) => {
        env.run('storybook', opts, (err: Error | null) => {
          if (err) return reject(err)
          return resolve(undefined)
        })
      })
    }

    if (flags.setup) {
      const domain = await this.validateDomain(flags.domain)
      const isAuthenticated = await this.prismic.isAuthenticated()
      if (!isAuthenticated) {
        await this.login()
      }

      return new Promise((resolve, reject) => {
        env.run('setup', {...opts, domain}, (err: Error | null) => {
          if (err) return reject(err)
          return resolve(undefined)
        })
      })
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
        return this.log(`log('Your SliceMachine repository was successfully created!') ${url.toString()}`)
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

      const token = cookie.parse(this.prismic.cookies)['prismic-auth']
      const endpoint = flags.customTypeEndpoint || 'https://silo2hqf53.execute-api.us-east-1.amazonaws.com/prod/slices'

      return this.prismic.axios().get(endpoint, {
        validateStatus: status => status < 209,
        headers: {
          'Content-Type': 'application/json',
          repository: this.readRepoName(),
          Authorization: `Bearer ${token}`,
        },
      })
      .then(async () => {
        const hasYarn = await lookpath('yarn')
        const usingYarn = fs.existsSync(path.join(process.cwd(), 'yarn.lock'))
        const pm = hasYarn && usingYarn ? 'yarn' : 'npm'
        return execSync(`${pm} slicemachine`, {stdio: 'inherit'})
      })
      .catch(error => {
        if (error?.response) {
          return this.warn(`[slices API]: ${error.response.statusText}`)
        }
        throw error
      })
    }

    if (!flags['create-slice'] && !flags['add-storybook'] && !flags.setup && !flags.list) {
      return this._help()
    }
  }

  private readRepoName(): string {
    const pathToSMFile = path.join(process.cwd(), SM_FILE)

    if (fs.existsSync(pathToSMFile) === false) {
      this.warn(`[slice-machine] No "apiEndpoint" value found in ${pathToSMFile} .\nIn order to run this command, you need to set a Prismic repository endpoint`)
      return this.exit()
    }

    const smFile = fs.readFileSync(pathToSMFile, 'utf-8')
    try {
      const apiEndpoint: string = JSON.parse(smFile).apiEndpoint
      const url = new URL(apiEndpoint)
      return url.hostname.split('.')[0]
    } catch {
      this.warn('[slice-machine] Could not parse domain from given "apiEndpoint" (must start with https protocol)')
      return this.exit()
    }
  }
}
