import { join } from 'path'

import CreateBaseCommand from '../base-commands/create.base.command'
import Template from '../utils/template'

export default class InitCommand extends CreateBaseCommand {
  static description = 'Initialize the code from a template for an existing prismic repository'

  static examples = [
    '$ prismic-cli init',
    '$ prismic-cli init foobar',
    '$ prismic-cli init foobar --directory foobar --template nodejs',
  ]

  static aliases = ['initialize']

  static args = [{ name: 'name', description: 'The name of the existing prismic repository' }]

  async run() {
    const { args, flags } = this.parse(InitCommand)

    // Make sure the user is signed in
    await this.authenticate()

    // Get the repository name
    let name: string = args.name
    // Get the directory to create the project folder
    let directory = flags.directory
    // Get the template name/type
    let template = (flags.template || '')
    // Determine whether it's forced
    const skipPrompt = flags['skip-prompt']

    if (!name) {
      name = await this.promptRepositoryName(name)
    }

    if (!skipPrompt) {
      directory = await this.promptDirectoryName(name, directory)
      template = await this.promptTemplateList(await Template.fetch(), template)
    } else {
      directory = join(process.cwd(), directory || name)
    }

    // Read the entire configuration file
    // const config = await Config.all()

    // Initialize the repository
    // await init(repository, { directory, template, force }, config)
  }
}

// async function init(repository: string, flags: InitCommandFlags, config: any = {}) {
//   const baseUrl = (config.domain || config.baseUrl || Config.defaults.baseURL()) as string
//   // Fetch the list of templates
//   /// Create the template ///
//   // Set BaseURL
//   // Set Directory
//   // Set Template
//   // readZipAndCreateRepoWithCustomTypes
//   // installAndDisplayInstructions
// }
