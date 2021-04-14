import PrismicGenerator from '../prismic-generator'

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
  }

  async prompting() {
    if (!this.pm) await this.promptForPackageManager()
  }

  async default() {
    this.config.set('framework', 'next')
    this.composeWith(require.resolve('../slicemachine'), {
      framework: 'next',
      domain: this.domain,
      prismic: this.prismic,
      path: this.destinationRoot(),
      pm: this.pm,
      ...this.options,
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
        export: 'next export',
      },
      dependencies: {
        next: '^10.1.3',
        react: '^17.0.2',
        'react-dom': '^17.0.2',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkjJson)
  }

  async install() {
    if (this.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall()
    }
  }
}
