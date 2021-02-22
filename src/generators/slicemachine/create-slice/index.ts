import * as Generator from 'yeoman-generator'
import * as isValidPath from 'is-valid-path'
import * as path from 'path'
import {fs} from '../../../utils'

function validateSliceName(name: string): boolean {
  // PascalCase
  const regexp = /^([A-Z][a-z]+){2,}$/
  return regexp.test(name)
}

function pascalCaseToSnakeCase(str: string) {
  return str.split(/(?=[A-Z])/).join('_').toLowerCase()
}

function toDescription(str: string) {
  return str.split(/(?=[A-Z0-9])/).join(' ')
}

export default class CreateSlice extends Generator {
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

  constructor(argv: string|string[], opts: Generator.GeneratorOptions) {
    super(argv, opts)

    this.option('framework', {
      type: String,
      description: 'framework to use',
      storage: this.config,
    })
  }

  async prompting() {
    const {library} = isValidPath(this.options.library) ? this.options : await this.prompt([{
      type: 'text',
      name: 'library',
      default: 'slices',
      prefix: '🗂 ',
      message: 'Where should we create your new local library?',
      validate: (value: string) => {
        return isValidPath(this.destinationPath(value)) || 'Invalid Path'
      },
    }])

    const {sliceName} = validateSliceName(this.options.sliceName) ? this.options : await this.prompt([{
      type: 'text',
      name: 'sliceName',
      message: 'Enter the name of your slice (2 words, PascalCased)',
      default: this.options.sliceName || 'TestSlice',
      validate: validateSliceName, // change validation to check for the slice as well.
    }])

    Object.assign(this.answers, {sliceName, library})
  }

  async configuring() {
    const pathToLib = this.destinationPath(path.join(this.answers.library, this.answers.sliceName))

    const sliceId = pascalCaseToSnakeCase(this.answers.sliceName)

    const description = toDescription(this.answers.sliceName)

    this.fs.copyTpl(
      this.templatePath('default/**'),
      pathToLib,
      {sliceName: this.answers.sliceName, sliceType: this.answers.sliceType, sliceId: sliceId, description},
    )

    this.fs.copyTpl(
      this.templatePath(path.join(this.options.framework || this.config.get('framework'), '**')),
      pathToLib,
      {sliceName: this.answers.sliceName, sliceType: this.answers.sliceType},
    )
  }

  async writing() {
    const libIndex = this.destinationPath(path.join(this.answers.library, 'index.js'))
    const hasLibIndex = fs.existsSync(libIndex)

    if (hasLibIndex) {
      this.fs.copy(libIndex, libIndex)
      const content = `export { default as ${this.answers.sliceName} } from './${this.answers.sliceName}`
      this.fs.append(libIndex, content)
      // TODO: do we want to make the user confirm updating these files?
      fs.unlink(libIndex)
    } else {
      this.fs.copyTpl(
        this.templatePath('index.js'),
        libIndex,
        {sliceName: this.answers.sliceName},
      )
    }

    const libName = path.join('@', this.answers.library)
    const {libraries} = this.readDestinationJSON('sm.json', {libraries: []}) as unknown as SliceMachineConfig

    if (libraries.includes(libName) === false) {
      this.fs.extendJSON('sm.json', {libraries: [...libraries, libName]})
    }

    if (fs.existsSync(this.destinationPath('sm.json'))) {
      // TODO: do we want to make the user confirm updating these files?
      fs.unlink(this.destinationPath('sm.json'))
    }
  }

  conflicts() {
    // conflicts can be handled here.
  }
}

export interface SliceMachineConfig {
  libraries: Array<string>;
  _latest: string;
  apiEndpoint: string;
}
