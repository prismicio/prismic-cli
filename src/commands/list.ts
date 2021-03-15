import {flags} from '@oclif/command'
import {Command} from './../prismic'
import generator from './../prismic/generator'

export default class List extends Command {
  static description = 'Lists available project templates.'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const generators = generator.getGeneratorsMeta()

    Object.keys(generators).forEach(d => this.log(d))
  }
}
