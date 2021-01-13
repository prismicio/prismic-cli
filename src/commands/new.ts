import {flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import {Command} from '../prismic'
import generator from '../prismic/generator'

export default class New extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),

    domain: flags.string({
      char: 'd',
      description: 'name of the prismic repository ie: example, becomes https://example.prismic.io',
      // required: true,
      parse: input => input.toLowerCase().trim(),
    }),

    folder: flags.string({
      char: 'f',
      description: 'name of project folder',
    }),

    template: flags.string({
      char: 't',
      description: 'Prismic template for the project',
    }),
    // flag with no value (-f, --force)
    force: flags.boolean(),
  }

  static args = [{
    name: 'no-install',
    default: false,
    description: 'skip running npm install',
  }]

  async run() {
    const {flags} = this.parse(New)

    const domain = await this.validateDomain(flags.domain)
    const folder = await this.validateFolder(flags.folder, domain, flags.force)

    const generators = generator.getGeneratorsMeta()

    const template = await this.validateTemplate(flags.template, Object.keys(generators))

    return new Promise((resolve, reject) => {
      generator.run(template, {
        domain,
        path: folder,
        prismic: this.prismic,
      }, ((err: Error, results: any) => {
        if (err) reject(err)
        else resolve(results)
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
}
