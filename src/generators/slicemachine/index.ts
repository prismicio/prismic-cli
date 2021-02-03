import * as Generator from 'yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'

const nuxtDeps = {
  '@nuxtjs/prismic': '^1.2.4',
  '@prismicio/vue': '^2.0.7',
  'nuxt-sm': '^0.0.6',
  'vue-essential-slices': '^0.2.0',
  'vue-slicezone': '^0.0.29',
}

const nextDeps = {
  'prismic-javascript': '3',
  'prismic-reactjs': '1',
  'next-slicezone': '0',
  'next-transpile-modules': '6',
  'theme-ui': '0',
  'essential-slices': '1',
}

const nuxtDevDeps = {
  'node-sass': '^5.0.0',
  'sass-loader': '^10.1.1',
  'slice-machine-ui': '^0.0.43',
}

const nextDevDeps = {
  '@babel/core': '^7.12.10',
  'slice-machine-ui': '^0.0.43',
}

function depsForFramework(framework: string) {
  switch(framework) {
    case 'next': {
      return {
        dependencies: nextDeps,
        devDependencies: nextDevDeps,
      }
    }
    case 'nuxt': {
      return {
        dependencies: nuxtDeps,
        devDependencies: nuxtDevDeps,
      }
    }
    default: return {}
  }
}

export default class SliceMachine extends Generator {
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

  constructor(argv: string | string[], opts: Generator.CompositionOptions) { // TODO: options
    super(argv, opts)
    this.option('framework', {
      type: String,
      description: 'framework to use',
      storage: this.config, // adding this to a store for later usage by create-slice
    })

    this.option('domain', {
      type: String,
      description: 'prismic.io subdomain',
    })
    
  }
  async initializing() {
    this.composeWith(require.resolve('./create-slice'), this.options)
  }

  async writing() { 

    const deps = depsForFramework(this.options.framework)

    const pkgJson = {
      scripts: {
        slicemachine: 'start-slicemachine --port 9999',
      },
      ...deps,
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    /*
    const smJson = {
      apiEndpoint: `https://${this.options.domain}.cdn.prismic.io/api/v2`,
      libraries: [
        '@/slices',
        'vue-essential-slices',
      ],
      _latest: '0.0.43', // same version as slice-machine-ui
    } 

    

    this.fs.extendJSON(this.destinationPath('sm.json'), smJson)
    */

    if(this.options.framework === 'nuxt') {

      const config = this.readDestination('nuxt.config.js')

      const updatedConfig = modifyNuxtConfig(config, this.options.domain)
      
      this.writeDestination('nuxt.config.js', updatedConfig)

    }

    if(this.options.framework === 'next') {
      // theses files could be removed from this package but would have to cocme from create-next-app
      // this.copyTemplate('next', this.destinationPath(), {globOptions:{dot: true}}, this.options)
      this.fs.copyTpl(this.templatePath(this.options.framework), this.destinationPath(), this.options, undefined, {globOptions: {dot: true}})
    }
    

    this.copyTemplate('default/**', this.destinationPath())

  }
}