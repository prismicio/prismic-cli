import PrismicGenerator, {TemplateOptions} from '@prismicio/prismic-yeoman-generator'
import {Question} from 'yeoman-generator'
import modifyNuxtConfig from './modify-nuxt-config'
import * as chalk from 'chalk'

const {SM_FILE} = require('sm-commons/consts')

export default class PrismicNuxt extends PrismicGenerator {
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

  pm: 'npm' | 'yarn' | undefined

  constructor(argv: string | string[], opts: TemplateOptions) {
    super(argv, opts)

    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }

    if (opts.domain) {
      this.domain = opts.domain
    }
  }

  async prompting() {
    const base = new URL(this.prismic.base)

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

    if (!this.pm) await this.promptForPackageManager()
  }

  async writing() {
    const pkgJson = {
      scripts: {
        slicemachine: 'start-slicemachine --port 9999',
      },
      dependencies: {
        '@nuxtjs/prismic': '^1.2.6',
        '@prismicio/vue': '^2.0.11',
        'nuxt-sm': '^0.0.6',
        'vue-essential-slices': '^0.3.0',
        'vue-slicezone': '^0.0.30',
      },
      devDependencies: {
        sass: '^1.35.1',
        'css-loader': '^5.2.6',
        'sass-loader': '^10.1.1',
        'slice-machine-ui': 'beta',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    const config = this.readDestination('nuxt.config.js')

    const updatedConfig = modifyNuxtConfig(config, this.domain)

    this.writeDestination('nuxt.config.js', updatedConfig)

    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      domain: this.domain,
      defaultLibrary: 'vue-essential-slices',
    })

    // maybe rename sm file
    if (this.existsDestination('sm.json') && SM_FILE !== 'sm.json') {
      this.moveDestination('sm.json', SM_FILE)
    }
    const customTypes = this.readCustomTypesFrom('customtypes')

    return this.prismic.createRepository({
      domain: this.domain,
      framework: 'nuxt',
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
    const sliceZoneReadmeUrl = 'https://prismic.io/docs/technologies/vue-slicezone-technical-reference'

    const quickStartDocsUrl = 'https://prismic.io/docs/technologies/nuxtjs'

    const addSlicesDocsUrl = 'https://prismic.io/docs/technologies/generate-model-component-nuxtjs'

    const url = new URL(this.prismic.base)
    if (this.domain) {
      url.hostname = `${this.domain}.${url.hostname}`
      url.pathname = 'documents'
    } else {
      url.pathname = 'dashboard'
    }
    const writingRoomUrl = url.toString()

    return this.log(`
Your project is now configured to use SliceMachine!
Follow these next steps to get going:
    
- Add the SliceZone, anywhere in your code
${sliceZoneReadmeUrl}
    
- Access your Prismic writing room here
${writingRoomUrl}
    
- To add your own slice, run this command
$> npx prismic-cli sm --create-slice
    
- Run slicemachine
$> npm run slicemachine
    
If you're not sure where you should start,
give SliceMachine documentation a try:
    
- Quick Start 👉 ${quickStartDocsUrl}
- Adding slices 👉 ${addSlicesDocsUrl}
`)
  }
}

