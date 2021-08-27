import {flags} from '@oclif/command'
import {Command} from '../prismic'
import {DEFAULT_PORT} from '../utils/server'
export default class Login extends Command {
  static description = 'Log in to Prismic.'

  static flags = {
    ...Command.flags,

    help: flags.help({char: 'h'}),

    base: flags.string({
      name: 'base',
      hidden: true,
      description: 'Base URL to authenticate with.',
      default: 'https://prismic.io',
    }),

    port: flags.integer({
      name: 'port',
      hidden: false,
      description: 'Port to start the local login server.',
      default: DEFAULT_PORT,
    }),

    'auth-url': flags.string({
      name: 'auth url',
      hidden: true,
      description: 'URL to validate and refresh tokens.',
      required: false,
    }),
  }

  static args = []

  async run() {
    const {flags} = this.parse(Login)
    const {base, port, 'auth-url': authUrl} = flags

    return this.login(port, base, authUrl)
  }
}
