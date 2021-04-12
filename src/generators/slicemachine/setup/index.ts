import PrismicGenerator, {TemplateOptions} from '../../prismic-generator'
import {Question} from 'yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'
import chalk from 'chalk'
import message from './message'
import {existsSync} from 'fs'

const {SM_FILE} = require('sm-commons/consts')

function depsForFramework(framework?: string) {
  switch (framework) {
  case 'next': return {
    'prismic-javascript': '^3.0.2',
    'prismic-reactjs': '^1.3.3',
    'next-slicezone': '^0.0.14',
    'next-transpile-modules': '^6.4.0',
    'theme-ui': '^0.3.5',
    'essential-slices': '^1.0.3',
  }
  case 'nuxt': return {
    '@nuxtjs/prismic': '^1.2.6',
    '@prismicio/vue': '^2.0.11',
    'nuxt-sm': '^0.0.6',
    'vue-essential-slices': '^0.3.0',
    'vue-slicezone': '^0.0.30',
  }
  default: return {}
  }
}

function devDepsForFramework(framework?: string) {
  switch (framework) {
  case 'next': return {
    '@babel/core': '^7.12.10',
    'slice-machine-ui': '^0.0.45',
  }
  case 'nuxt': return {
    'node-sass': '^5.0.0',
    'sass-loader': '^10.1.1',
    'slice-machine-ui': '^0.0.45',
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

  pm: 'npm' | 'yarn' | undefined

  constructor(argv: string | string[], opts: TemplateOptions) {
    super(argv, opts)

    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }

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

    if (!this.pm) await this.promptForPackageManager()
  }

  async writing() {
    const pkgJson = {
      scripts: {
        slicemachine: 'start-slicemachine --port 9999',
      },
      dependencies: depsForFramework(this.framework),
      devDependencies: devDepsForFramework(this.framework),
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    if (this.framework === 'nuxt') {
      const config = this.readDestination('nuxt.config.js')

      const updatedConfig = modifyNuxtConfig(config, this.domain)

      this.writeDestination('nuxt.config.js', updatedConfig)
    }

    if (this.framework === 'next') {
      // theses files could be removed from this package but would have to come from create-next-app
      const useSrc = existsSync(this.destinationPath('src'))
      this.fs.copyTpl(this.templatePath('next'), this.destinationPath(), {smFile: SM_FILE, useSrc}, undefined, {globOptions: {dot: true}})

      if (useSrc) {
        this.deleteDestination('pages')
        this.fs.copyTpl(this.templatePath('next/pages'), this.destinationPath('src/pages'), {smFile: SM_FILE, useSrc}, undefined, {globOptions: {dot: true}})
      }
    }
    this.fs.copyTpl(this.templatePath('default/**'), this.destinationPath(), {
      domain: this.domain,
      latest: '0.0.43',
      defaultLibrary: defaultLibForFrameWork(this.framework),
    })

    // maybe rename sm file
    if (this.existsDestination('sm.json') && SM_FILE !== 'sm.json') {
      this.moveDestination('sm.json', SM_FILE)
    }
    const customTypes = this.readCustomTypesFrom('custom_types')

    return this.prismic.createRepository({
      domain: this.domain,
      customTypes,
    }).then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data || this.domain}.${url.host}`
      this.log(`A new repository has been created at: ${url.toString()}`)
      return res
    })
  }

  async install() {
    if (this.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall()
    }
  }

  async end() {
    this.log(message(this.framework, this.domain, this.prismic.base))
  }
}
