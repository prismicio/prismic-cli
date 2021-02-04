import {Command, flags} from '@oclif/command'

export default class Sm extends Command {
  static description = 'slicemachine commands'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    // name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    // force: flags.boolean({char: 'f'}),
    createSlice: flags.boolean({
      description: 'create a new slice',
    })
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Sm)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/marc/Projects/prismic/prismic-cli/src/commands/sm.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
