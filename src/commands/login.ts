import {flags} from '@oclif/command'
import {Command, LoginData} from '../prismic'
import cli from 'cli-ux'
// import {CLIError} from '@oclif/errors'

export default class Login extends Command {
  static description = 'Login to prismic'

  static flags = {
    ...Command.flags,
    help: flags.help({char: 'h'}),
    email: flags.string({
      name: 'email',
      description: 'email address',
    }),
    password: flags.string({
      name: 'password',
      description: 'password',
    }),
    base: flags.string({
      name: 'base',
      hidden: true,
      description: 'base url to authenticate with',
      default: 'https://prismic.io',
    }),
    oauthaccesstoken: flags.string({
      name: 'oauthaccesstoken',
      description: 'oauth access token for sso',
      exclusive: ['email', 'password'],
    }),
  }

  static args = []

  private async handleLogin(data: Partial<LoginData>): Promise<void> {
    return this.prismic.login(data)
    .then(() => this.log(`Successfully logged in to ${data.base || this.prismic.base}`))
    .catch(error => {
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        return this.log(`Login error, check your credentials. If you forgot your password, visit ${data.base || this.prismic.base} to reset it`)
      }
      // throw new CLIError(error.message)
      throw error
    })
  }

  async run() {
    const {flags}  = this.parse(Login)
    const {oauthaccesstoken, base} = flags

    if (oauthaccesstoken) {
      return this.handleLogin({oauthaccesstoken, base})
    }

    const email = flags.email ?? await cli.prompt('Email')
    const password = flags.password ?? await cli.prompt('Password', {type: 'hide'})

    return this.handleLogin({email, password, base})
  }
}
