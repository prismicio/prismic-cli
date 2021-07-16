import PrismicGenerator, {TemplateOptions} from '@prismicio/prismic-yeoman-generator'
const isValidPath = require('is-valid-path')
import * as nodePath from 'path'
import * as fs from 'fs'
import * as inquirer from 'inquirer' // this is easier to mock
const path = nodePath.posix

const {SM_FILE} = require('sm-commons/consts')

function validateSliceName(name: string): boolean {
  // PascalCase
  const regexp = /^([A-Z][a-z]+){2,}$/
  if (!name) return false
  return regexp.test(name)
}
export default class CreateSlice extends PrismicGenerator {
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
  answers: Record<string, string> = {}

  constructor(argv: string|string[], opts: TemplateOptions) {
    super(argv, opts)

    if (this.destinationRoot().endsWith(this.path) === false) {
      this.destinationRoot(this.path)
    }
  }

  async prompting() {
    // TODO: case where a user may already have a slice library to add to
    const {library} = isValidPath(this.options.library) ? this.options : await inquirer.prompt<{library: string}>([{
      type: 'text',
      name: 'library',
      default: 'slices',
      prefix: '🗂 ',
      message: 'Where should we create your new local library?',
      validate: (value: string) => {
        return (value && isValidPath(this.destinationPath(value))) || ('Invalid Path: ' + value)
      },
    }])

    const {sliceName} = validateSliceName(this.options.sliceName) ? this.options : await inquirer.prompt<{sliceName: string}>([{
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
    this.copySliceTemplate(this.answers.library, this.answers.sliceName)
  }

  async writing() {
    // change to library and library/slice
    const libIndex = this.destinationPath(path.join(this.answers.library, 'index.js'))
    const hasLibIndex = fs.existsSync(libIndex)

    if (hasLibIndex) {
      this.fs.copy(libIndex, libIndex)
      const content = `export { default as ${this.answers.sliceName} } from './${this.answers.sliceName}'`
      this.fs.append(libIndex, content)
    } else {
      this.fs.copyTpl(
        this.templatePath('library/index.js'),
        libIndex,
        {sliceName: this.answers.sliceName},
      )
    }

    const libName = path.join('@', this.answers.library)
    const {libraries} = this.readDestinationJSON(SM_FILE, {libraries: []}) as unknown as SliceMachineConfig

    if (libraries.includes(libName) === false) {
      // update sm.json
      this.fs.extendJSON(this.destinationPath(SM_FILE), {libraries: [...libraries, libName]})
    }
  }
}

export interface SliceMachineConfig {
  libraries: Array<string>;
  _latest: string;
  apiEndpoint: string;
}
