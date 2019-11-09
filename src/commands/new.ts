import { flags } from '@oclif/command'
import gittar = require('gittar')
import { join } from 'path'

import CreateBaseCommand from '../base-commands/create.base.command'
import Template from '../utils/template'

export default class NewCommand extends CreateBaseCommand {
  static description = 'Create a project: initialize the code for a new prismic repository'

  static examples = [
    '$ prismic-cli new foobar',
    '$ prismic-cli new foobar --theme prismicio/nuxtjs-website',
    '$ prismic-cli new foobar --theme https://github.com/prismicio/nuxtjs-websie.git'
  ]

  static flags = {
    ...CreateBaseCommand.flags,
    config: flags.string({ char: 'c', default: 'prismic.config.js' }),
    // TODO: Skip configuration file logic
    'skip-config': flags.string({ char: 'C' }),
    theme: flags.string({ char: 't' })
  }

  static args = [{ name: 'repository' }]

  async run() {
    const { args, flags } = this.parse(NewCommand)
    // Get the repository name
    let repository: string = args.repository
    // Get the directory to create the project folder
    let directory = flags.directory
    // Get the template name/type
    let template = (flags.template || '')
    // Determine whether prompt should be skipped
    const skipPrompt = flags['skip-prompt']

    await this.authenticate()

    if (!repository) {
      repository = await this.promptRepositoryName(repository)
    }

    if (!skipPrompt) {
      directory = await this.promptDirectoryName(repository, directory)
      template = await this.promptTemplateList(await Template.fetch(), template)
    } else {
      directory = join(process.cwd(), directory || repository)
    }

    if (args.theme) {
      try {
        await gittar.fetch(args.theme)
      } catch (error) {
        this.log(error.message)
      }
    }
  }
}
