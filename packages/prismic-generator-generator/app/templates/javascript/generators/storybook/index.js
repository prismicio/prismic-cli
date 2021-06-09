const Generator = require('@prismicio/prismic-yeoman-generator').default
const {SM_FILE} = require('sm-commons/consts')

module.exports = class StoryBook extends Generator {
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

    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }
  }

  async prompting() {
    if (!this.pm) await this.promptForPackageManager()
  }

  async writing() {
    const pkJson = {
      devDependencies: {
      },
      scripts: {
        storybook: 'start-storybook -p 8888', // Or how ever story is to be started
        'build-storybook': 'build-storybook',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkJson)

    const smJson = {
      storybook: 'http://localhost:8888', // remember to change the port as needed
    }

    this.fs.extendJSON(this.destinationPath(SM_FILE), smJson)


    const smfile = this.readDestinationJSON(SM_FILE)
    const libraries = smfile.libraries || []

    // read sm file for local libraries.
    const localLibs = libraries.filter(lib => lib.startsWith('@/')).map(lib => lib.substring(2))

    const stories = localLibs.reduce((acc, p) => {
      return acc.concat([
        `../${p}/**/*.stories.[tj]s`,
        `../.slicemachine/assets/${p}/**/*.stories.[tj]s`,
      ])
    }, [])

    const storiesString = JSON.stringify(stories)

    const storyBookEntry = `
module.exports = {
  stories: ${storiesString}
}
`
    // Update storybook configuration 
    // this.writeDestination('.storybook/main.js',  storyBookEntry)
  }

  async install() {
    if (this.pm === 'yarn') {
      return this.yarnInstall()
    }
    return this.npmInstall()
  }
}
