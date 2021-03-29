import {flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'
import Command from '../prismic/base-command'
import * as path from 'path'
import login from './login'
import {fs} from '../utils'

const globby = require('fast-glob')

export default class Slicemachine extends Command {
  static description = 'Slice Machine Commands'

  static flags = {
    help: flags.help({char: 'h'}),

    force: flags.boolean({char: 'f'}),

    setup: flags.boolean({
      description: 'setup slice machine in an already existing project',
      exclusive: ['create-slice', 'add-storybook', 'list', 'bootstrap'],
      default: false,
    }),

    domain: flags.string({
      char: 'd',
      description: 'prismic repo to to create',
      exclusive: ['add-storybook', 'create-slice', 'sliceName', 'library', 'list'],
    }),

    'create-slice': flags.boolean({
      description: 'add a slice to a slicemachine project',
      exclusive: ['setup', 'add-storybook', 'list', 'bootstrap'],
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
      exclusive: ['setup', 'create-slice', 'list', 'bootstrap'],
      default: false,
    }),

    framework: flags.string({
      options: ['next', 'nuxt'],
    }),

    list: flags.boolean({
      description: 'list local slices',
      exclusive: ['add-storybook', 'setup', 'create-slice', 'bootstrap', 'sliceName', 'domain', 'library', 'framework', 'folder', 'skip-install'],
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
      exclusive: ['setup', 'create-slice', 'list'],
      default: false,
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
        await login.run([])
      }

      return new Promise((resolve, reject) => {
        env.run('setup', {...opts, domain}, (err: Error | null) => {
          if (err) return reject(err)
          return resolve(undefined)
        })
      })
    }

    if (flags.list) {
      const pathToSMFile = path.join(folder, 'sm.json')
      if (fs.existsSync(pathToSMFile) === false) {
        this.error(`Could not find sm.json at: ${pathToSMFile}`)
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
      const smFilePath = path.join(folder, 'sm.json')

      if (fs.existsSync(smFilePath) === false) {
        return this.warn('sm.json file not found in:' + smFilePath)
      }

      const isAuthenticated = await this.prismic.isAuthenticated()
      if (!isAuthenticated) {
        await login.run([])
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

    if (!flags['create-slice'] && !flags['add-storybook'] && !flags.setup && !flags.list) {
      return this._help()
    }
  }
}
