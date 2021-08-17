import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import * as inquirer from 'inquirer'
import {Command} from '../prismic'
import prismicGenerators, {names} from '../prismic/yeoman-env'

export default class New extends Command {
  static description = 'Create a project with a new Prismic repository.'

  static flags = {
    help: flags.help({char: 'h'}),

    domain: flags.string({
      char: 'd',
      description: 'Name of the Prismic repository. For example: repo-name, becomes https://repo-name.prismic.io.',
      parse: (input: string) => input.toLowerCase().trim(),
    }),

    folder: flags.string({
      char: 'f',
      description: 'Name of the project folder.',
    }),

    template: flags.string({
      char: 't',
      description: 'Prismic template for the project.',
    }),

    force: flags.boolean({
      description: 'Over write local files.',
      default: false,
    }),

    'skip-install': flags.boolean({
      description: 'Prevent running install command after generating project.',
      default: false,
    }),
  }

  static args = []

  async run() {
    const isAuthenticated = await this.prismic.isAuthenticated()

    if (!isAuthenticated) {
      await this.login()
    }

    const {flags} = this.parse(New)

    const domain = await this.validateDomain(flags.domain)
    const folder = await this.validateFolder(flags.folder, domain, flags.force)

    const generators = names.map(value => {
      const nameWithOutPrefix = value.replace('prismic-', '').replace(/js$/i, 'JS')
      return {
        name: nameWithOutPrefix.charAt(0).toUpperCase() + nameWithOutPrefix.slice(1),
        value,
      }
    })

    const isValidTemplate = flags.template && names.includes(`prismic-${flags.template.toLowerCase()}`) ? `prismic-${flags.template.toLowerCase()}` : ''

    const template: string = isValidTemplate || await inquirer.prompt({
      type: 'list',
      name: 'template',
      message: 'Template to use',
      choices: generators,
    }).then(res => res.template)

    return new Promise((resolve, reject) => {
      prismicGenerators.run(template, {
        ...flags,
        domain,
        path: folder,
        prismic: this.prismic,
      }, ((err: Error) => {
        if (err) return reject(err)
        return resolve(null)
      }) as (err: Error | null) => void)
    })
  }

  async validateTemplate(template: string | undefined, options: Array<string>): Promise<string> {
    if (template && options.includes(template)) return Promise.resolve(template)
    return inquirer.prompt({
      type: 'list',
      name: 'template',
      message: 'Template to use',
      choices: options,
    }).then(res => res.template)
  }

  async registerCustomGenerator(generator: string, namespace? : string) {
    const name = namespace ? namespace : await cli.prompt('name')
    prismicGenerators.register(generator, name)
  }
}
