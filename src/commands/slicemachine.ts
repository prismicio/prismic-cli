import {flags} from '@oclif/command'
import { IConfig } from '@oclif/config'
import {createEnv} from 'yeoman-environment'
import Command from '../prismic/base-command'

export default class Slicemachine extends Command {

  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),

    setup: flags.boolean({
      description: 'setup slice machine in an already existing project',
      exclusive: ['create-slice', 'storybook'],
      default: false,
    }),

    'create-slice': flags.boolean({
      description: 'add a slice to a slicemachine project',
      exclusive: ['setup', 'storybook'],
      default: false,
    }),

    'add-storybook': flags.boolean({
      description: 'add storybook to a slicemachine project',
      exclusive: ['setup', 'create-slice'],
      default: false,
    }),

    framework: flags.string({
      options: ['next', 'nuxt'],
    }),

    path: flags.string({
      default: process.cwd(),
    }),

  }

  async run() {
    const env = createEnv()
    env.register(require.resolve('../generators/slicemachine/setup'), 'slicemachine')
    env.register(require.resolve('../generators/slicemachine/create-slice'), 'create-slice')
    env.register(require.resolve('../generators/slicemachine/storybook'), 'storybook')

    const {flags} = this.parse(Slicemachine)

    const opts = {...flags, prismic: this.prismic}

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
      return new Promise((resolve, reject) => {
        env.run('slicemachine', opts, (err: Error | null) => {
          if (err) return reject(err)
          return resolve(undefined)
        })
      })
    }
  }
}
