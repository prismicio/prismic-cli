const PrismicGenerator = require('@prismicio/prismic-yeoman-generator').defaults
const isValidPath = require('is-valid-path')
const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer') // this is easier to mock

const {snakelize} = require('sm-commons/utils/str')
const {SM_FILE} = require('sm-commons/consts')

function validateSliceName(name) {
  // PascalCase
  const regexp = /^([A-Z][a-z]+){2,}$/
  if (!name) return false
  return regexp.test(name)
}

function pascalCaseToSnakeCase(str) { return snakelize(str) }

function toDescription(str) { return str.split(/(?=[A-Z0-9])/).join(' ') }

module.exports = class CreateSlice extends PrismicGenerator {
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
    this.answers = {}
    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }
  }

  async prompting() {
    const {library} = isValidPath(this.options.library) ? this.options : await inquirer.prompt([{
      type: 'text',
      name: 'library',
      default: 'slices',
      prefix: '🗂 ',
      message: 'Where should we create your new local library?',
      validate: (value) => {
        return (value && isValidPath(this.destinationPath(value))) || ('Invalid Path: ' + value)
      },
    }])

    const {sliceName} = validateSliceName(this.options.sliceName) ? this.options : await inquirer.prompt([{
      type: 'text',
      name: 'sliceName',
      message: 'Enter the name of your slice (2 words, PascalCased)',
      default: this.options.sliceName || 'TestSlice',
      validate: value => {
        return validateSliceName(value) || 'Must be PascalCased'
      }, // change validation to check for the slice as well.
    }])

    Object.assign(this.answers, {sliceName, library})
  }

  async configuring() {
    const pathToLib = this.destinationPath(path.join(this.answers.library, this.answers.sliceName))

    const sliceId = pascalCaseToSnakeCase(this.answers.sliceName)

    const description = toDescription(this.answers.sliceName)

    this.fs.copyTpl(
      this.templatePath('library/slice/**'),
      pathToLib,
      {sliceName: this.answers.sliceName, sliceId: sliceId, description},
    )
    /* for the slicemachine update */
    const slicesDirectoryPath = path.join('.slicemachine', 'assets', this.answers.library, this.answers.sliceName)
    this.moveDestination(path.join(pathToLib, 'index.stories.js'), path.join(slicesDirectoryPath, 'index.stories.js'))
    this.moveDestination(path.join(pathToLib, 'mocks.json'), path.join(slicesDirectoryPath, 'mocks.json'))
  }

  async writing() {
    // change to library and lbrary/slice rather that index, default and next
    const libIndex = this.destinationPath(path.join(this.answers.library, 'index.js'))
    const hasLibIndex = fs.existsSync(libIndex)

    if (hasLibIndex) {
      this.fs.copy(libIndex, libIndex)
      const content = `export { default as ${this.answers.sliceName} } from './${this.answers.sliceName}`
      this.fs.append(libIndex, content)
    } else {
      this.fs.copyTpl(
        this.templatePath('library/index.js'),
        libIndex,
        {sliceName: this.answers.sliceName},
      )
    }

    const libName = path.join('@', this.answers.library)
    const {libraries} = this.readDestinationJSON(SM_FILE, {libraries: []})

    if (libraries.includes(libName) === false) {
      this.fs.extendJSON(this.destinationPath(SM_FILE), {libraries: [...libraries, libName]})
    }
  }
}
