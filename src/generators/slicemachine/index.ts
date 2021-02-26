import PrismicGenerator, {TemplateOptions} from '../base'

/* one shot setup, create-slice and add storybook alot of this is repeated.... maybe it should be an abstract class */

export default class SliceMachine extends PrismicGenerator {
  framework: 'nuxt' | 'next' | undefined

  constructor(args: string | string[], opts: TemplateOptions) {
    super(args, opts)
    if (opts.framework) {
      this.config.set('framework', opts.framework)
    }
    this.framework = opts.framework || this.config.get('framework')
    if (opts.path) {
      this.destinationRoot(opts.path)
    }
  }

  async prompting() {
    if (!this.framework) {
      this.prompt([{
        name: 'framework',
        type: 'list',
        choices: ['next', 'nuxt'],
        message: 'framework',
        store: this.config,
      }]).then(({framework}) => {
        this.framework = framework
      })
    }
  }

  /**
   * initializing - Your initialization methods (checking current project state, getting configs, etc)
   * prompting - Where you prompt users for options (where you’d call this.prompt())
   * configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
   * default - If the method name doesn’t match a priority, it will be pushed to this group.
   * writing - Where you write the generator specific files (routes, controllers, etc)
   * conflicts - Where conflicts are handled (used internally)
   * install - Where installations are run (npm, bower)
   * end - Called last, cleanup, say good bye, etc
   */

  async default() {
    const opts = {...this.options, prismic: this.prismic, domain: this.domain, path: this.destinationRoot(), framework: this.framework}
    // options: framework, domain, path
    this.composeWith(require.resolve('./setup'), opts)
    // options: framework, prompts: library, sliceName
    this.composeWith(require.resolve('./create-slice'), opts)
    // options: framework
    this.composeWith(require.resolve('./storybook'), opts)
  }
}
