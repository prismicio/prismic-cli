import {flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'
import Command from '../prismic/base-command'
import * as path from 'path'
import {fs} from '../utils'

const globby = require('fast-glob')

export default class Slicemachine extends Command {
  static description = 'Slice Machine Commands'

  static flags = {
    help: flags.help({char: 'h'}),

    force: flags.boolean({char: 'f'}),

    setup: flags.boolean({
      description: 'setup slice machine in an already existing project',
      exclusive: ['create-slice', 'storybook', 'list'],
      default: false,
    }),
    domain: flags.string({
      char: 'd',
      description: 'prismic repo to to create',
      dependsOn: ['setup'],
    }),

    'create-slice': flags.boolean({
      description: 'add a slice to a slicemachine project',
      exclusive: ['setup', 'storybook', 'list'],
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
      exclusive: ['setup', 'create-slice', 'list'],
      default: false,
    }),

    framework: flags.string({
      options: ['next', 'nuxt'],
    }),

    list: flags.boolean({
      description: 'list local slices',
      exclusive: ['add-storybook', 'setup', 'create-slice'],
      default: false,
    }),

    folder: flags.string({
      default: process.cwd(),
    }),

  }

  async run() {
    const env = createEnv()
    env.register(require.resolve('../generators/slicemachine/setup'), 'setup')
    env.register(require.resolve('../generators/slicemachine/create-slice'), 'create-slice')
    env.register(require.resolve('../generators/slicemachine/storybook'), 'storybook')

    const {flags} = this.parse(Slicemachine)

    const opts = {...flags, prismic: this.prismic, path: flags.folder}

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

      return new Promise((resolve, reject) => {
        env.run('setup', {...opts, domain}, (err: Error | null) => {
          if (err) return reject(err)
          return resolve(undefined)
        })
      })
    }

    if (flags.list) {
      const pathToSMFile = path.join(flags.folder, 'sm.json')
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
            flags.folder,
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

    if (!flags['create-slice'] && !flags['add-storybook'] && !flags.setup && !flags.list) {
      return this._help()
    }
  }
}
