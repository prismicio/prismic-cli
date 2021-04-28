import {flags} from '@oclif/command'
import {Command} from './../prismic'
import {names} from '../prismic/yeoman-env'

export default class List extends Command {
  static description = 'Lists available project templates.'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const generators = names.map(name => {
      const nameWithOutPrismicPrefix = name.replace('prismic-', '').replace(/js$/i, 'JS')
      return nameWithOutPrismicPrefix.charAt(0).toUpperCase() + nameWithOutPrismicPrefix.slice(1)
    })

    generators.forEach(d => this.log(d))
  }
}
