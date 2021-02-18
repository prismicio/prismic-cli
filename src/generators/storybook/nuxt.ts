import {SliceMachineJson} from '../base'
import * as Generator from 'yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'
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
      devDependencies: [
        '@nuxtjs/storybook',
        'babel-loader',
      ],
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkJson)

    const smJson = {
      storybook: 'http://localhost:3003',
    }

    this.fs.extendJSON(this.destinationPath('sm.json'), smJson)
    
    const smfile = this.readDestinationJSON('sm.json') as unknown as SliceMachineJson

    const libraries = smfile.libraries || []

    // read sm.json for local libraries.
    const localLibs = libraries.filter(lib => lib.startsWith('@/'))
    
    const stories = localLibs.map(p => `../${p}/**/*.stories.[tj]s`)

    const config = this.readDestination('nuxt.config.js')

    const updatedConfig = modifyNuxtConfig(config. stories)

    this.writeDestination('nuxt.config.js', updatedConfig)
  }
}

