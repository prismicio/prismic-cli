import PrismicGenerator, {TemplateOptions} from '../base'


export default class StoryBook extends PrismicGenerator {

  framework: 'nuxt'| 'next'

  constructor(argv: string | string[], opts: TemplateOptions) {
    super(argv, opts)
    
    this.option('framework', {
      type: String,
      description: 'framework',
      storage: this.config, // adding this to a store for later usage by create-slice
    })

    this.framework = this.options.get('framework') || this.config.get('framework')
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

  async prompting() {
    // maybe prompot for framework or check for framework
  }

  async configuring() {
    if (this.framework === 'next') {
      this.composeWith(require.resolve('./next'), this.options)
    }
    if (this.framework === 'next') {
      this.composeWith(require.resolve('./nuxt'), this.options)
    }
  }
}
