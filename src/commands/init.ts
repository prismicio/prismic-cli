import { join } from 'path'

import create from '../actions/create'
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

  static flags = {
    ...CreateBaseCommand.flags
  }

  async run() {
    const result = this.parse(InitCommand)
    let { name } = result.args
    let { directory, template, ...flags } = result.flags
    // Make sure the user is authenticated
    await this.authenticate()

    if (!name) {
      name = await this.promptRepositoryName(name)
    }

    if (!flags['skip-prompt']) {
      directory = await this.promptDirectoryName(name, directory)
      template = await this.promptTemplateList(await Template.fetch(), template)
    } else {
      directory = join(process.cwd(), directory || name)
    }

    try {
      await create(name, directory, 'init', { template, ...flags })
    } catch (error) {
      this.error(error)
    }
  }
}
