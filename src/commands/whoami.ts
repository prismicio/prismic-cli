import {flags} from '@oclif/command'
import {Command} from '../prismic'

export default class Whoami extends Command {
  static description = 'Shows the user name of the current user'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    return this.prismic.validateSession()
    .then(res => {
      return this.log(res.data.email)
    })
    .catch(error => {
      const status = error?.response?.status || 100
      if (Math.floor(status / 100) === 4) {
        return this.log('Not logged in')
      }
      throw error
    })
  }
}
