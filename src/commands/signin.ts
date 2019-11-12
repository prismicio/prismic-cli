import AuthBaseCommand from '../base-commands/auth.base.command'

export default class SignInCommand extends AuthBaseCommand {
  static description = 'Sign into an existing prismic.io account'

  static examples = ['$ prismic-cli signup']

  static aliases = ['login']

  static flags = {
    ...AuthBaseCommand.flags
  }

  async run() {
    const { flags } = this.parse(SignInCommand)

    if (flags.status) {
      return this.status()
    }

    let valid = false
    while (!valid) {
      try {
        await this.signin(await SignInCommand.promptCredential())
        valid = true
      } catch (_) { }
    }
  }
}
