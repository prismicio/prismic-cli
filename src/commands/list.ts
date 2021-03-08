import {Command, flags} from '@oclif/command'
import generator from './../prismic/generator'

export default class List extends Command {
  static description = 'Lists avaible project templates.'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    const generators = generator.getGeneratorsMeta()

    Object.keys(generators).forEach(d => this.log(d))
  }
}
