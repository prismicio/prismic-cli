import { flags } from '@oclif/command'
import { join } from 'path'

import create from '../actions/create'
import CreateBaseCommand from '../base-commands/create.base.command'
import Template from '../utils/template'

export default class NewCommand extends CreateBaseCommand {
  static description = 'Create a new project and a prismic repository'

  static examples = [
    '$ prismic-cli new foobar',
    '$ prismic-cli new foobar --theme prismicio/nuxtjs-website',
    '$ prismic-cli new foobar --theme https://github.com/prismicio/nuxtjs-website',
    '$ prismic-cli new foobar --template nodejs',
    '$ prismic-cli new --quickstart'
  ]

  static flags = {
    ...CreateBaseCommand.flags,
    theme: flags.string({ char: 't', description: 'Set the theme\'s url' }),
    users: flags.string({ char: 'u', description: 'Set the users' }),
    quickstart: flags.boolean({ char: 'q', description: 'Set up a Node.js project with a new prismic repository' }),
    'skip-config': flags.boolean({ char: 'C', description: 'Skip the configuration file' })
  }

  static args = [{ name: 'name' }]

  async run() {
    const result = this.parse(NewCommand)
    let { name } = result.args
    let { directory, template, theme, ...flags } = result.flags
    // Make sure the user is authenticated
    await this.authenticate()

    if (!name) {
      name = await this.promptRepositoryName(name)
    }

    if (!flags['skip-prompt']) {
      directory = await this.promptDirectoryName(name, directory)
      if (!theme && !flags.quickstart) {
        template = await this.promptTemplateList(await Template.fetch(), template)
      }
    } else {
      directory = join(process.cwd(), directory || name)
    }

    try {
      await create(name, directory, 'new', { template, theme, ...flags })
    } catch (error) {
      this.error(error)
    }
  }
}
