import PrismicGenerator, {TemplateOptions} from '../../base'

export default class StoryBook extends PrismicGenerator {
  framework: 'nuxt'| 'next' | undefined

  constructor(argv: string|string[], opts: TemplateOptions) {
    super(argv, opts)
    // TODO: this logic is repeated in setup, create-slice and here
    if (opts.framework) {
      this.config.set('framework', opts.framework)
      this.framework = opts.framework
    } else {
      this.framework = this.config.get('framework')
    }
  }

  async prompting() {
    // TODO: maybe prompt for framework or check for framework
    // this.framework = this.options.framework || this.config.get('framework')

    if (!this.framework) {
      this.prompt([
        {
          name: 'framework',
          type: 'list',
          choices: ['next', 'nuxt'],
        },
      ]).then(res => {
        this.framework = res.framework
      })
    }
  }

  async configuring() {
    if (this.framework === 'next') {
      this.composeWith(require.resolve('./next'), this.options)
    }
    if (this.framework === 'nuxt') {
      this.composeWith(require.resolve('./nuxt'), this.options)
    }
    // TODO handle other frameworks
  }

  async install() {
    this.npmInstall()
  }
}
