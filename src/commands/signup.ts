import AuthBaseCommand from '../base-commands/auth.base.command'

export default class SignupCommand extends AuthBaseCommand {
  static description = 'Create a new prismic.io account'

  static examples = [
    '$ prismic-cli signup',
  ]

  async run() {
    let valid = false
    while (!valid) {
      try {
        await this.signup(await SignupCommand.promptCredential())
        valid = true
      } catch (error) {
        this.log(Array.isArray(error) ? error[0] : error)
      }
    }
  }
}
