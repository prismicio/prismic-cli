import {Command, flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'

export default class CreateGenerator extends Command {
  static description = 'create a new generator'

  static hidden = true

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name for the generator'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),

    'skip-install': flags.boolean({
      default: false,
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
