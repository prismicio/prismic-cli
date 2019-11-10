import AuthBaseCommand from '../base-commands/auth.base.command'

export default class SignInCommand extends AuthBaseCommand {
  static description = 'Sign into an existing prismic.io account'

  static examples = ['$ prismic-cli signup']

  static aliases = ['login']

  async run() {
    let valid = false
    while (!valid) {
      try {
        await this.signin(await SignInCommand.promptCredential())
        valid = true
      } catch (_) { }
    }
  }
}
