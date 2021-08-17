import {Command, flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'

export default class CreateGenerator extends Command {
  static description = 'Create a new generator.'

  static hidden = true

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'Name for the generator.'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),

    'skip-install': flags.boolean({
      default: false,
    }),

    pm: flags.string({
      char: 'p',
      description: 'Package manager.',
      required: false,
      options: ['npm', 'yarn'],
    }),

    language: flags.string({
      char: 'l',
      description: 'Language to write the generator in.',
      required: false,
      options: ['js', 'ts'],
      parse: value => {
        switch (value) {
        case 'js': return 'javascript'
        case 'ts': return 'typescript'
        default: return value
        }
      },
    }),

    path: flags.string({
      char: 'f',
      description: 'Project where to create the generator.',
    }),
  }

  async run() {
    const {flags} = this.parse(CreateGenerator)

    const env = createEnv()
    env.register(require.resolve('@prismicio/prismic-generator-generator'), 'generator')

    return new Promise((resolve, reject) => {
      env.run('generator', flags, error => {
        if (error) return reject(error)
        return resolve(null)
      })
    })
  }
}
