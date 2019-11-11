import AuthBaseCommand from '../base-commands/auth.base.command'

export default class SignOutCommand extends AuthBaseCommand {
  static description = 'Sign out from an existing prismic.io account'

  static examples = [
    '$ prismic-cli signout',
    '$ prismic-cli logout'
  ]

  static aliases = ['logout']

  static flags = {
    ...AuthBaseCommand.flags
  }

  async run() {
    const { flags } = this.parse(SignOutCommand)
    if (flags.status) {
      return this.status()
    }

    await this.signout()
  }
}
