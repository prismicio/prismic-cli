import PrismicGenerator from '@prismicio/prismic-yeoman-generator'
import * as inquirer from 'inquirer'
export default class extends PrismicGenerator {
  /**
   * initializing - Your initialization methods (checking current project state, getting configs, etc)
   *
   * prompting - Where you prompt users for options (where you’d call this.prompt())
   *
   * configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
   *
   * default - If the method name doesn’t match a priority, it will be pushed to this group.
   *
   * writing - Where you write the generator specific files (routes, controllers, etc)
   *
   * conflicts - Where conflicts are handled (used internally)
   *
   * install - Where installations are run (npm, bower)
   *
   * end - Called last, cleanup, say good bye, etc
   */

  // slicemachine: boolean | undefined;

  async initializing() {
    this.destinationRoot(this.path)
  }

  async configuring() {
    this.config.set('framework', 'nextjs')
  }

  async prompting() {
    if (!this.pm) await this.promptForPackageManager()
    if (this.options.slicemachine === undefined) {
      this.options.slicemachine = await inquirer.prompt<{slicemachine: boolean}>([{

        name: 'slicemachine',
        type: 'confirm',
        default: true,
        message: 'Slice Machine',
      }]).then(res => res.slicemachine)
    }
  }

  async default() {
    const opts = {framework: 'nextjs', force: this.force, domain: this.domain, prismic: this.prismic, path: this.destinationRoot(), pm: this.pm, ...this.options}

    if (this.options.slicemachine) {
      this.composeWith('prismic-nextjs:slicemachine', opts)
      this.composeWith('prismic-nextjs:create-slice', opts)
      this.composeWith('prismic-nextjs:storybook', opts)
    }
  }

  async writing() {
    this.fs.copyTpl(
      this.templatePath('**'),
      this.destinationPath(),
      {domain: this.domain},
      undefined,
      {globOptions: {dot: true}},
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
        '@prismicio/client': '^5',
        'prismic-reactjs': '^1.3.3',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkjJson)

    if (!this.options.slicemachine) {
      this.maybeCreatePrismicRepository({domain: this.domain, framework: 'next'}, this.existingRepo)
    }
  }

  async install() {
    if (this.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall(undefined, {'legacy-peer-deps': true})
    }
  }
}
