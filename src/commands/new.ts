import {flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import {Command} from '../prismic'
import cli from 'cli-ux'
import {fs} from '../utils'

// evntually move this into the build runner
import {createEnv} from 'yeoman-environment'
 
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

    // move this to the runner.
    const env = createEnv()
    /* const generators = env.lookup({
      packagePaths: [
        require.resolve('../generators'),
      ],
    }) */
    // generator-prismic-...

    env.register(
      require.resolve('../generators/NodeJS'), // make this dynamic?
      'NodeJS', // make this dynamic?
    )
    env.register(
      require.resolve('../generators/React'),
      'React',
    )

    env.register(
      require.resolve('../generators/Angular2'),
      'Angular2',
    )

    env.register(
      require.resolve('../generators/Vue'),
      'VueJS',
    )

    const generators = env.getGeneratorsMeta()
    // console.log({generators})

    const template = await this.validateTemplate(flags.template, Object.keys(generators))

    return new Promise((resolve, reject) => {
      env.run(template, { // make the env name an option/dynamic
        domain,
        path: folder,
        prismic: this.prismic,
      }, ((err: Error, results: any) => {
        if (err) reject(err)
        else resolve(results)
      }) as (err: Error | null) => void)
    })
  }

  // TODO: move this to base-command
  async validateDomain(name: string | undefined): Promise<string> {
    return this.prismic.validateRepositoryName(name)
    .catch(error => {
      this.log(error.message)
      return cli.prompt('prismic subdomain', {required: true}).then(this.validateDomain.bind(this))
    })
  }

  // TODO: move this to base-command
  async validateFolder(name: string | undefined, fallback: string, force: boolean): Promise<string> {
    const folder: string = name || await cli.prompt('project folder', {default: fallback})

    if (fs.existsSync(folder) && !force) {
      this.warn(`Folder: ${folder} exists. use --force to overwrite`)
      return this.exit()
    }
    return Promise.resolve(folder)
  }

  // TODO: make more options
  async validateTemplate(template: string | undefined, options: Array<string>): Promise<string> {
    if (template) return Promise.resolve(template)
    return inquirer.prompt({
      type: 'list',
      name: 'template',
      message: 'Template to use',
      choices: options,
    }).then(res => res.template)
  }
}
