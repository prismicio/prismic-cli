import AuthBaseCommand from '../base-commands/auth.base.command'
import Config from '../utils/config'

export default class SignOutCommand extends AuthBaseCommand {
  static description = 'Sign out from an existing prismic.io account'

  static examples = [
    '$ prismic-cli signout',
    '$ prismic-cli logout'
  ]

  static aliases = ['logout']

  async run() {
    await this.signout()
    // Reset debug
    await Config.set({ debug: false })
  }
}
