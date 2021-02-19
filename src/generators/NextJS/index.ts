import PrismicGenerator from '../base'

export default class NextJS extends PrismicGenerator {

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

  async initializing() {
    this.destinationRoot(this.path)
    this.composeWith(require.resolve('../slicemachine'), {
      framework: 'next',
      domain: this.domain,
      prismic: this.prismic,
    })
  }

  async writing() {
    this.fs.copyTpl(
      this.templatePath('**'),
      this.destinationPath(),
      {domain: this.domain},
      undefined,
      {globOptions: {dot: true}}
    )

    const pkjJson = {
      name: this.domain,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^10.0.7',
        react: '^16',
        'react-dom': '^16',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkjJson)
  }

  async install() {
    this.npmInstall()
  }
}
