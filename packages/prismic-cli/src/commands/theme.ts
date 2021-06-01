import {flags} from '@oclif/command'
import {Command} from '../prismic'
import generator from '../prismic/yeoman-env'

export default class Theme extends Command {
  static description = 'Create a project from a zip file or github repository with a new prismic repository.'

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

    'theme-url': flags.string({
      char: 't',
      description: 'Url or path to the theme',
    }),

    conf: flags.string({
      char: 'c',
      description: 'path to prismic configuration file',
      default: 'prismic-configuration.js',
    }),

    documents: flags.string({
      description: 'path to documents in the theme',
      default: 'documents',
    }),

    customTypes: flags.string({
      description: 'path to custom types directory in the theme',
      default: 'custom_types',
    }),

    force: flags.boolean({
      description: 'over-write local files',
    }),

    'skip-install': flags.boolean({
      description: 'prevent running install command after generating project',
      default: false,
    }),

  }

  static args = [{
    name: 'source',
    description: 'path or url to a zip file, or a github Repository for the theme',
    required: false,
  }]

  async run() {
    const isAuthenticated = await this.prismic.isAuthenticated()
    if (!isAuthenticated) {
      await this.login()
    }

    const {flags, args} = this.parse(Theme)

    const domain = await this.validateDomain(flags.domain)
    const folder = await this.validateFolder(flags.folder, domain, flags.force)
    const theme = await this.validateTheme(flags['theme-url'] || args.source)

    generator.register(
      require.resolve('../generators/theme'),
      'Theme',
    )

    return new Promise((resolve, reject) => {
      generator.run('Theme', {
        domain,
        source: theme,
        path: folder,
        prismic: this.prismic,
        configPath: flags.conf,
        ...flags,
      }, ((err: Error, results: any) => {
        if (err) reject(err)
        else resolve(results)
      }) as (err: Error | null) => void)
    })
  }
}
