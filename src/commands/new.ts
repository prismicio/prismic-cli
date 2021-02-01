import {flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import {Command} from '../prismic'
import generator from '../prismic/generator'
import login from './login'

export default class New extends Command {
  static description = 'Create a project with a new prismic repository.'

  static flags = {
    help: flags.help({char: 'h'}),

    domain: flags.string({
      char: 'd',
      description: 'name of the prismic repository ie: example, becomes https://example.prismic.io',
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

    force: flags.boolean({
      description: 'over write local files',
    }),

    // TODO: add a generator command where a person can pass custom generator?s
  }

  static args = []

  async run() {
    const isAuthenticated = await this.prismic.isAuthenticated()
    if (!isAuthenticated) {
      await login.run([])
    }

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
