import PrismicGenerator, {TemplateOptions} from '../../base'
import {Question} from 'yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'
import chalk from 'chalk'

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

function depsForFramework(framework: string | undefined) {
  switch (framework) {
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

function defaultLibForFrameWork(framework: string | undefined): string {
  switch (framework) {
  case 'next': return 'essential-slices'
  case 'nuxt': return 'vue-essential-slices'
  default: return ''
  }
}

export default class SliceMachine extends PrismicGenerator {
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
  framework: 'next'| 'nuxt' | undefined

  constructor(argv: string | string[], opts: TemplateOptions) { // TODO: options
    super(argv, opts)
    // this.framework = opts.framework || this.framework

    if (opts.framework) {
      this.config.set('framework', opts.framework)
      this.framework = opts.framework
    } else {
      this.framework = this.framework || this.config.get('framework')
    }

    if (opts.domain) {
      this.domain = opts.domain
    }
  }

  async prompting() {
    const base = new URL(this.prismic.base)
    const pkJson = this.readDestinationJSON('package.json', {}) as Record<string, any>

    const deps = pkJson.dependencies || {}

    if (!this.framework && deps.next) {
      this.framework = 'next'
    } else if (!this.framework && deps.nuxt) {
      this.framework = 'nuxt'
    }

    if (!this.domain) {
      const validateRepositoryName = this.prismic.validateRepositoryName
      const domainPrompt: Question = {
        type: 'input',
        name: 'domain',
        message: 'Name your prismic repository: ',
        transformer(value: string) {
          const reponame = value ? chalk.cyan(value) : chalk.dim.cyan('repo-name')
          const msg = [
            chalk.dim(`${base.protocol}//`),
            reponame,
            chalk.dim(`.${base.hostname}`),
          ]
          return msg.join('')
        },
        validate: async (value: string) => {
          const result = await validateRepositoryName(value)
          return result === value || result
        },
      }
      this.domain = await this.prompt(domainPrompt).then(res => res.domain)
    }

    if (!this.framework) {
      const frameWorkPrompt: Question = {
        type: 'list',
        name: 'framework',
        store: true,
        message: 'framework',
        choices: ['next', 'nuxt'],
      }
      this.framework = await this.prompt(frameWorkPrompt).then(res => res.framework)
      this.config.set('framework', this.framework)
    }
  }

  async writing() {
    const deps = depsForFramework(this.framework)

    const pkgJson = {
      scripts: {
        slicemachine: 'start-slicemachine --port 9999',
      },
      ...deps,
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    if (this.framework === 'nuxt') {
      const config = this.readDestination('nuxt.config.js')

      const updatedConfig = modifyNuxtConfig(config, this.domain)

      this.writeDestination('nuxt.config.js', updatedConfig)
    }

    if (this.framework === 'next') {
      // theses files could be removed from this package but would have to come from create-next-app
      // this.copyTemplate('next', this.destinationPath(), {globOptions:{dot: true}}, this.options)
      this.fs.copy(this.templatePath('next'), this.destinationPath(), {globOptions: {dot: true}})
    }

    this.fs.copyTpl(this.templatePath('default/**'), this.destinationPath(), {
      domain: this.domain,
      latest: '0.0.43',
      defaultLibrary: defaultLibForFrameWork(this.framework),
    })

    const customTypes = this.readCustomTypesFrom('custom_types')
    
    return this.prismic.createRepository({
      domain: this.domain,
      customTypes,
    }).then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data || this.domain}.${url.host}`
      this.log(`A new repsitory has been created at: ${url.toString()}`)
      return res
    })
  }

  async install() {
    this.npmInstall()
  }
}
