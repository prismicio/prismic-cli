import {Command, flags} from '@oclif/command'
import {createEnv} from 'yeoman-environment'

export default class CreateSlice extends Command {
  static description = 'create a new slice in slicemachine'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({
      char: 'n',
      description: 'name of the new slice',
    }),

    library: flags.string({
      char: 'l',
      description: 'library to add slice to',
      default: 'slices',
    }),

    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'folder'}]

  async run() {
    const {flags, args} = this.parse(CreateSlice)
    
    const env = createEnv()
    env.register(require.resolve('../generators/slicemachine/create-slice'), 'slicemachine:create-slice')

    return new Promise((resolve, reject) => {
      return env.run('slicemachine:create-slice', {
        sliceName: flags.name,
        library: flags.library,
        path: args.folder || process.cwd(),
      },  ((err: Error, results: any) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          resolve(results)
        }
      }) as (err: Error | null) => void)
    })
  }
}
