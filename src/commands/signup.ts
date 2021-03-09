import {flags} from '@oclif/command'
import {Command} from '../prismic'
import cli from 'cli-ux'

export default class Signup extends Command {
  static description = 'Create a prismic account'

  static flags = {
    help: flags.help({char: 'h'}),

    email: flags.string({
      description: 'email address',
    }),

    password: flags.string({
      description: 'password',
    }),

    base: flags.string({
      description: 'change the base url to signup to',
      hidden: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Signup)

    const email = flags.email ?? await cli.prompt('Email')
    const password = flags.password ?? await cli.prompt('Password', {type: 'hide'})

    return this.prismic.signUp(email, password, flags.base)
    .then(() => this.log(`Succesfully signed up to ${this.prismic.base}`))
    .catch(error => {
      if (error?.response?.data?.errors) {
        this.log('Oops, received some errors:')
        return [].concat(error.response.data.errors).forEach(e => this.log(e))
      }
      if (error?.response) {
        return this.log(`Error: [${error.response.statusCode}]: ${error.response.statusText}`)
      }
      return this.error(error)
    })
  }
}
