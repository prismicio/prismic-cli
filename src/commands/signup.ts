import AuthBaseCommand from '../base-commands/auth.base.command'

export default class SignupCommand extends AuthBaseCommand {
  static description = 'Create a new prismic.io account.'

  static examples = [
    '$ prismic-cli signup',
  ]

  async run() {
    let valid = false
    while (!valid) {
      const { email, password } = await this.promptSignup()
      try {
        await this.signup(email, password)
        valid = true
      } catch (_) { }
    }
  }
}
