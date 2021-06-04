import PrismicGenerator, {TemplateOptions, SliceMachineJson} from '@prismicio/prismic-yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'
const {SM_FILE} = require('sm-commons/consts')
import * as path from 'path'

export default class StoryBookNuxt extends PrismicGenerator {
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

  pm: 'npm' | 'yarn' | undefined;

  constructor(argv: string | string[], opts: TemplateOptions) { // TODO: options
    super(argv, opts)
    // this.pm = this.pm || 'npm'
    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }
  }

  async prompting() {
    if (!this.pm) await this.promptForPackageManager()
  }

  async writing() {
    const pkJson = {
      scripts: {
        storybook: 'nuxt storybook',
        'build-storybook': 'nuxt storybook build',
      },
      devDependencies: {
        '@storybook/vue': '6.1.21',
        'vue-loader': '15.9.6',
        '@nuxtjs/storybook': '3.3.1',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkJson)

    const smJson = {
      storybook: 'http://localhost:3003',
    }

    this.fs.extendJSON(this.destinationPath(SM_FILE), smJson)

    const smfile = this.readDestinationJSON(SM_FILE) as unknown as SliceMachineJson

    const libraries: Array<string> = smfile.libraries || []

    // read sm file for local libraries.
    const localLibs = libraries.filter(lib => lib.startsWith('@' + path.sep)).map(lib => lib.substring(2))

    const config = this.readDestination('nuxt.config.js')

    const updatedConfig = modifyNuxtConfig(config, localLibs)

    this.writeDestination('nuxt.config.js', updatedConfig)
  }

  async install() {
    if (this.pm === 'yarn') {
      return this.yarnInstall()
    }
    return this.npmInstall()
  }
}

