const PrismicGenerator = require('@prismicio/prismic-yeoman-generator').default
const {SM_FILE} = require('sm-commons/consts')

class SliceMachine extends PrismicGenerator {
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

  constructor(argv, opts) {
    super(argv, opts)
    this.pm = opts.pm
    this.domain = opts.domain
    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }
  }

  async prompting() {
    if (!this.pm) await this.promptForPackageManager()
  }

  async writing() {
    const pkgJson = {
      scripts: {
        slicemachine: 'start-slicemachine --port 9999',
      },
      dependencies: {},
      devDependencies: {
        'slice-machine-ui': 'beta',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson)

    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      defaultLibrary: '',
      domain: this.domain,
    }, undefined, {
      globOptions: {dot: true},
    })

    // maybe rename sm file
    if (this.existsDestination('sm.json') && SM_FILE !== 'sm.json') {
      this.moveDestination('sm.json', SM_FILE)
    }

    const customTypes = this.readCustomTypesFrom('custom_types')
    return this.maybeCreatePrismicRepository({domain: this.domain, framework: '<%= name %>', customTypes}, this.existingRepo)
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
    
- Add the SliceZone, anywhere in your code https://github.com/prismicio/slice-machine
- Access your Prismic writing room here
${writingRoomUrl}
    
- To add your own slice, run this command
$> npx prismic-cli sm --create-slice
    
- Run slicemachine
$> npx prismic-cli sm --develop
`)
  }
}

module.exports = SliceMachine