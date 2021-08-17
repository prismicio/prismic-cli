import {flags} from '@oclif/command'
import {Command} from '../prismic'
import cli from 'cli-ux'
import {DEFAULT_PORT} from '../utils/server'
import {LogDecorations, PRISMIC_LOG_HEADER} from '../utils/logDecoration'

export default class Signup extends Command {
  static description = 'Create a Prismic account.'

  static flags = {
    help: flags.help({char: 'h'}),

    base: flags.string({
      name: 'base',
      hidden: true,
      description: 'Base URL to sign up with.',
      default: 'https://prismic.io',
    }),

    port: flags.integer({
      name: 'port',
      hidden: false,
      description: 'Port to start the local login server.',
      default: DEFAULT_PORT,
    }),

    'auth-url': flags.string({
      hidden: true,
      name: 'auth-url',
      description: 'URL to use when validating and refreshing sessions.',
    }),
  }

  async run() {
    const {flags} = this.parse(Signup)
    const {base, port, 'auth-url': authUrl} = flags

    // ask confirmation
    const confirmationMessage = PRISMIC_LOG_HEADER + 'Press any key to open up the browser to signup or ' + LogDecorations.FgRed + 'q' + LogDecorations.Reset + ' to exist'
    const confirmationKey: string = await cli.prompt(confirmationMessage, {type: 'single', required: false})

    if (confirmationKey === 'q' || confirmationKey === '\u0003') return Promise.resolve()

    return this.prismic.signUp(port, base, authUrl)
  }
}
