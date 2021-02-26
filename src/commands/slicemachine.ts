import {flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'
import Command from '../prismic/base-command'

export default class Slicemachine extends Command {
  static description = 'Slice Machine Commands'

  static flags = {
    help: flags.help({char: 'h'}),

    force: flags.boolean({char: 'f'}),

    setup: flags.boolean({
      description: 'setup slice machine in an already existing project',
      exclusive: ['create-slice', 'storybook'],
      default: false,
    }),
    domain: flags.string({
      char: 'd',
      description: 'prismic repo to to create',
      dependsOn: ['setup'],
    }),

    'create-slice': flags.boolean({
      description: 'add a slice to a slicemachine project',
      exclusive: ['setup', 'storybook'],
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
      exclusive: ['setup', 'create-slice'],
      default: false,
    }),

    framework: flags.string({
      options: ['next', 'nuxt'],
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

    if (!flags['create-slice'] && !flags['add-storybook'] && !flags.setup) {
      return this._help()
    }
  }
}
