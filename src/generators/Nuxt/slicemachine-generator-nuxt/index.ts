import * as Generator from 'yeoman-generator'
import modifyNuxtConfig from '../modify-nuxt-config'

export default class SliceMacchine extends Generator {
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
    const pkgJson = {
      scripts: {
        slicemachine: 'start-slicemachine --port 9999',
      },
      dependencies: {
        '@nuxtjs/prismic': '^1.2.4',
        '@prismicio/vue': '^2.0.7',
        'nuxt-sm': '^0.0.6',
        'prismic-javascript': '^3.0.2',
        'vue-essential-slices': '^0.2.0',
        'vue-slicezone': '^0.0.29',
      },
      devDependencies: {
        'node-sass': '^5.0.0',
        'sass-loader': '^10.1.1',
        'slice-machine-ui': '^0.0.43',
      },
    }

    const smJson = {
      apiEndpoint: `https://${this.options.domain}.cdn.prismic.io/api/v2`,
      libraries: [
        '@/slices',
        'vue-essential-slices',
      ],
      _latest: '0.0.43', // same version as slice-machine-ui
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    this.fs.extendJSON(this.destinationPath('sm.json'), smJson)
    
    const config = this.readDestination('nuxt.config.js')

    const updatedConfig = modifyNuxtConfig(config, this.options.domain)
    
    this.writeDestination('nuxt.config.js', updatedConfig)

    this.copyTemplate('**', this.destinationPath())

  }
}