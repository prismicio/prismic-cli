import {flags} from '@oclif/command'
import {Command} from '../prismic'
import cli from 'cli-ux'
import * as EmailValidator from 'email-validator'
import {IConfig} from '@oclif/config'

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
      description: 'change the base url to sign-up to',
      hidden: true,
    }),
  }

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.emailPrompt = this.emailPrompt.bind(this)
    this.passwordPrompt = this.passwordPrompt.bind(this)
  }

  async emailPrompt(email?: string): Promise<string> {
    const retry = async (): Promise<string> => cli.prompt('Email', {required: true}).then(this.emailPrompt)

    if (!email) return retry()

    if (EmailValidator.validate(email)) return email

    this.warn('Enter a valid email address')
    return retry()
  }

  async passwordPrompt(password?: string): Promise<string> {
    const retry = async (): Promise<string> => cli.prompt('Password', {type: 'hide', required: true}).then(this.passwordPrompt)
    if (!password) return retry()

    if (password.length < 6) {
      this.warn('Enter a longer password (minimum 6 characters)')
      return retry()
    }

    if (password.trim().length !== password.length) {
      this.warn('No leading or trailing spaces')
      return retry()
    }

    return password
  }

  async run() {
    const {flags} = this.parse(Signup)

    const email = await this.emailPrompt(flags.email)
    const password = await this.passwordPrompt(flags.password)

    return this.prismic.signUp(email, password, flags.base)
    .then(() => this.log(`Succesfully signed up to ${this.prismic.base}`))
    .catch(error => {
      if (error?.response?.data?.errors) {
        this.log('Oops, received some errors')

        if (Array.isArray(error.response.data.errors)) {
          return [].concat(error.response.data.errors).forEach(e => this.warn(e))
        }

        const errors: Record<string, string[]> = error.response.data.errors
        return Object.entries(errors).forEach(([name, errs]) => errs.forEach(e => this.warn(`${name}: ${e}`)))
      }
      if (error?.response) {
        return this.log(`Error: [${error.response.statusCode}]: ${error.response.statusText}`)
      }
      return this.error(error)
    })
  }
}
