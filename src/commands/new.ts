import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import * as inquirer from 'inquirer'
import {Command} from '../prismic'
import prismicGenerators from '../prismic/generator'
import * as path from 'path'
import {fs} from '../utils'

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
      default: false,
    }),

    'skip-install': flags.boolean({
      description: 'prevent running install command after generating project',
      default: false,
    }),

    generator: flags.string({
      char: 'g',
      description: 'Run a local yeoman generator',
      exclusive: ['template'],
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

    if (flags.generator) {
      // validate folder exists.

      if (fs.existsSync(flags.generator) === false) {
        return this.warn(`Could not find: ${flags.generator}`)
      }
      // run a custom generator

      const pathToPkgJson = path.resolve(flags.generator, 'package.json')

      const pkgJson = require(pathToPkgJson)

      const name: string = pkgJson?.name || await cli.prompt('Generator name:')

      // issue with the main field from yo generator where the main field is incorrect.
      let main: string = path.resolve(flags.generator, pkgJson?.main)

      if (fs.existsSync(main) === false) {
        this.warn(`${pathToPkgJson}: main field is misconfigured... trying ${path.join(flags.generator, 'generators', 'app', 'index.js')}`)
        main = path.resolve(flags.generator, 'generators', 'app', 'index.js')
      }

      if (fs.existsSync(main) === false) {
        return this.warn(`${main} did not resolve, exiting`)
      }

      prismicGenerators.register(main, name)
      return this.runGenerator(name, domain, folder)
    }

    const generators = prismicGenerators.getGeneratorsMeta()

    const template = await this.validateTemplate(flags.template, Object.keys(generators))

    return this.runGenerator(template, domain, folder)
  }

  private async runGenerator(template: string, domain: string, folder: string) {
    const {flags} = this.parse(New)

    return new Promise((resolve, reject) => {
      prismicGenerators.run(template, {
        ...flags,
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

  async registerCustomGenerator(generator: string, namespace? : string) {
    const name = namespace ? namespace : await cli.prompt('name')
    prismicGenerators.register(generator, name)
  }
}
