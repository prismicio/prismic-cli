import { flags } from '@oclif/command'
import { extract, fetch } from 'gitly'
import { join } from 'path'

import CreateBaseCommand from '../base-commands/create.base.command'
import Template from '../utils/template'

export default class NewCommand extends CreateBaseCommand {
  static description = 'Create a new project and a prismic repository'

  static examples = [
    '$ prismic-cli new foobar',
    '$ prismic-cli new foobar --theme prismicio/nuxtjs-website',
    '$ prismic-cli new foobar --theme https://github.com/prismicio/nuxtjs-website',
    '$ prismic-cli new foobar --template nodejs'
  ]

  static flags = {
    ...CreateBaseCommand.flags,
    config: flags.string({ char: 'c', default: 'prismic.config.js' }),
    // TODO: Skip configuration file logic
    'skip-config': flags.boolean({ char: 'C' }),
    theme: flags.string({ char: 't' })
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
      if (!theme) {
        template = await this.promptTemplateList(await Template.fetch(), template)
      }
    } else {
      directory = join(process.cwd(), directory || name)
    }

    try {
      await create({ name, directory, template, theme, flags })
    } catch (error) {
      this.error(error.message ? error.message : error)
    }
  }
}

interface ICreationContext {
  name: string
  directory: string
  template?: string
  theme?: string
  flags: {
    ['skip-prompt']: boolean
    ['skip-config']: boolean
  }
}

type ICreationFactory = (context: ICreationContext) => Promise<void>

const create: ICreationFactory = async ({ name, directory, template, theme }) => {
  console.log('name', name, 'directory', directory, 'template', template, 'theme', theme)
  const url: string = (((await Template.find(template || '')) || {}).url) || theme || ''
  console.log(url)

  /**
   * Scenarios:
   *
   * --New--
   * 1. No local project and no prismic repository
   *   - 1. Create project from scratch template
   *   - 2. Create project from theme
   *
   * --Init--
   * 1. Local project and no prismic repository
   *  - 1. Create a remote prismic repository
   */

  // Download the template
  if (url) {
    const tempDir = await fetch(url)
    await extract(tempDir, directory)
  }
}
