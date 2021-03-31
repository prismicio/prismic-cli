import {SliceMachineJson} from '../../base'
import * as Generator from 'yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'
const {SM_FILE} = require('sm-commons/consts')

export default class StoryBookNext extends Generator {
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

  async writing() {
    const pkJson = {
      scripts: {
        storybook: 'nuxt storybook',
        'build-storybook': 'nuxt storybook build',
      },
      devDependencies: {
        '@nuxtjs/storybook': '3.3.1',
        'babel-loader': '*',
        '@storybook/vue': '6.1.21',
        'vue-loader': '15.9.6',
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
    const localLibs = libraries.filter(lib => lib.startsWith('@/')).map(lib => lib.substring(2))

    const config = this.readDestination('nuxt.config.js')

    const updatedConfig = modifyNuxtConfig(config, localLibs)

    this.writeDestination('nuxt.config.js', updatedConfig)
  }
}

