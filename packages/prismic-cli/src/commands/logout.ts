import {flags} from '@oclif/command'
import {Command} from '../prismic'

export default class Logout extends Command {
  static description = 'logout of prismic'

  static flags = {
    help: flags.help({char: 'h'}), // -h causes errors?
  }

  async run() {
    this.parse(Logout)
    /* istanbul ignore next: covered else where */
    return this.prismic.logout().then(() => this.log('Logged out'))
  }
}
