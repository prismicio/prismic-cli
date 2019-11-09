import AuthBaseCommand from '../base-commands/auth.base.command'

export default class SignInCommand extends AuthBaseCommand {
  static description = 'Sign into an existing prismic.io account.'

  static examples = [
    '$ prismic-cli signup',
  ]

  static aliases = ['login']

  async run() {
    let valid = false
    while (!valid) {
      const { email, password } = await this.promptSignup()
      try {
        await this.signin(email, password)
        valid = true
      } catch (_) {
        this.error(_)
      }
    }
  }
}
