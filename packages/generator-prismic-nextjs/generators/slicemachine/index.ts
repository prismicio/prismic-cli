import PrismicGenerator, {TemplateOptions} from '@prismicio/prismic-yeoman-generator'
import type {Question} from 'yeoman-generator'
import * as chalk from 'chalk'
import {existsSync} from 'fs'

const {SM_FILE} = require('sm-commons/consts')

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
  framework: string;

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
      this.framework = this.config.get('framework') || 'nextjs'
      this.config.set('framework', this.framework)
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
        'prismic-javascript': '^3.0.2',
        'prismic-reactjs': '^1.3.3',
        'next-slicezone': '^0.0.14',
        'next-transpile-modules': '^6.4.0',
        'theme-ui': '^0.6.2',
        'essential-slices': '^1.0.3',
      },
      devDependencies: {
        '@babel/core': '^7.12.10',
        'slice-machine-ui': '^0.0.45',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    // theses files could be removed from this package but would have to come from create-next-app
    const useSrc = existsSync(this.destinationPath('src'))
    
    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      smFile: SM_FILE,
      useSrc,
      defaultLibrary: 'essential-slices',
      domain: this.domain,
      latest: '0.0.43',
    }, undefined, {
      globOptions: {dot: true},
    })

    if (useSrc) {
      this.deleteDestination('pages')
      this.fs.copyTpl(this.templatePath('next/pages'), this.destinationPath('src/pages'), {smFile: SM_FILE, useSrc}, undefined, {globOptions: {dot: true}})
    }

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
    const url = new URL(this.prismic.base)

    if (this.domain) {
      url.hostname = `${this.domain}.${url.hostname}`
      url.pathname = 'documents'
    } else {
      url.pathname = 'dashboard'
    }

    const writingRoomUrl = url.toString()

    this.log(`
Your project is now configured to use SliceMachine!
Follow these next steps to get going:
    
- Add the SliceZone, anywhere in your code https://github.com/prismicio/slice-machine/tree/master/packages/next-slicezone
    
- Access your Prismic writing room here
${writingRoomUrl}
    
- To add your own slice, run this command
$> npx prismic-cli sm --create-slice
    
- Run slicemachine
$> npx prismic-cli sm --develop
    
If you're not sure where you should start,
give SliceMachine documentation a try:
    
- Quick Start 👉 https://prismic.io/docs/technologies/quick-start-nextjs
- Adding slices 👉 https://prismic.io/docs/technologies/create-your-own-slices-components-nextjs
`)
  }
}

