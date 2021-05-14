import Generator, {SliceMachineJson, TemplateOptions} from '@prismicio/prismic-yeoman-generator'
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

  constructor(argv: string|string[], opts: TemplateOptions) {
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
        '@storybook/react': '^6.2.8',
        'babel-loader': '^8.2.2',
        'babel-plugin-react-require': '^3.1.3',
      },
      scripts: {
        storybook: 'start-storybook -p 8888',
        'build-storybook': 'build-storybook',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkJson)

    const babelrc = {
      presets: [
        ['next/babel'],
      ],
      plugins: ['react-require'],
    }

    this.fs.extendJSON(this.destinationPath('.babelrc'), babelrc)

    const smJson = {
      storybook: 'http://localhost:8888',
    }

    this.fs.extendJSON(this.destinationPath(SM_FILE), smJson)

    // the default next teamplte doesn't contain a bablerc

    const smfile = this.readDestinationJSON(SM_FILE) as unknown as SliceMachineJson

    const libraries = smfile.libraries || []

    // read sm file for local libraries.
    const localLibs = libraries.filter(lib => lib.startsWith('@/')).map(lib => lib.substring(2))

    const stories = localLibs.reduce<ReadonlyArray<string>>((acc, p) => {
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

    // TODO: what to do if main.js already axists?
    this.writeDestination('.storybook/main.js',  storyBookEntry)
  }

  async install() {
    if (this.pm === 'yarn') {
      return this.yarnInstall()
    }
    return this.npmInstall(undefined, {'legacy-peer-deps': true}) // TODO: remove once storybook installs with out peer-dep related errors
  }
}
