import { Command } from '@oclif/command'

import Template from '../utils/template'

export default class ListCommand extends Command {
  static description = 'List the available code templates'

  static examples = [
    '$ prismic-cli list',
    '$ prismic-cli ls'
  ]

  static aliases = ['ls']

  async run() {
    this.log((await Template.available()).join('\n'))
  }
}
