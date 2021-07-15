import {flags} from '@oclif/command'
import {Command, LoginData} from '../prismic'
import cli from 'cli-ux'
import {AxiosError} from 'axios'
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

    'auth-url': flags.string({
      name: 'auth url',
      hidden: true,
      description: 'url to validate and refresh tokens',
      required: false,
    }),
  }

  static args = []

  private async handleLogin(data: Partial<LoginData>): Promise<void> {
    return this.prismic.login(data)
    .then(() => this.log(`Successfully logged in to ${data.base || this.prismic.base}`))
    .catch((error: AxiosError) => {
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        this.log(`Login error, check your credentials. If you forgot your password, visit ${data.base || this.prismic.base} to reset it`)
        // return new Login([], this.config).run() // for asking repeatedly
        return this.login()
      // throw new CLIError(error.message)
      }
      throw error
    })
  }

  async run() {
    const {flags}  = this.parse(Login)
    const {oauthaccesstoken, base, 'auth-url': authUrl} = flags

    if (oauthaccesstoken) {
      return this.handleLogin({oauthaccesstoken, base, authUrl})
    }

    const email = flags.email ?? await cli.prompt('Email')
    const password = flags.password ?? await cli.prompt('Password', {type: 'hide'})

    return this.handleLogin({email, password, base, authUrl})
  }
}
