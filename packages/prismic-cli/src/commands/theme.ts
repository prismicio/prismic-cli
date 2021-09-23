import {flags} from '@oclif/command'
import {Command} from '../prismic'
import generator from '../prismic/yeoman-env'

export default class Theme extends Command {
  static description = 'Create a project from a ZIP file or a GitHub repository URL and a new Prismic repository.'

  static flags = {
    help: flags.help({char: 'h'}),

    domain: flags.string({
      char: 'd',
      description: 'Name of the new Prismic repository. For example, repo-name becomes https://repo-name.prismic.io.',
      parse: input => input.toLowerCase().trim(),
    }),

    folder: flags.string({
      char: 'f',
      description: 'Name of the project folder.',
    }),

    'theme-url': flags.string({
      char: 't',
      description: 'GitHub URL or path to the theme file.',
    }),

    conf: flags.string({
      char: 'c',
      description: 'Path to Prismic configuration file.',
      default: 'prismic-configuration.js',
    }),

    documents: flags.string({
      description: 'Path to the documents in the theme.',
      default: 'documents',
    }),

    customTypes: flags.string({
      description: 'Path to the Custom Types directory in the theme.',
      default: 'custom_types',
    }),

    force: flags.boolean({description: 'Overwrite local files.'}),

    'skip-install': flags.boolean({
      description: 'Prevent running install command after generating project.',
      default: false,
    }),

    'existing-repo': flags.boolean({
      description: 'Connect to an existing Prismic repository.',
      default: false,
    }),

  }

  static args = [{
    name: 'source',
    description: 'Path or URL to a ZIP file, or a GitHub repository for the theme.',
    required: false,
  }]

  async run() {
    const isAuthenticated = await this.prismic.isAuthenticated()
    if (!isAuthenticated) {
      await this.login()
    }

    const {flags, args} = this.parse(Theme)

    const existingRepo = flags['existing-repo'] || false
    const domain = await this.validateDomain(flags.domain, existingRepo)
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
        existingRepo,
        ...flags,
      }, ((err: Error, results: any) => {
        if (err) reject(err)
        else resolve(results)
      }) as (err: Error | null) => void)
    })
  }
}
