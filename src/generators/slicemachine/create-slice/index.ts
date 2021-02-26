import PrismicGenerator, {TemplateOptions} from '../../base'
const isValidPath = require('is-valid-path')
import * as path from 'path'
import {fs} from '../../../utils'
import * as inquirer from 'inquirer' // this is easier to mock

function validateSliceName(name: string): boolean {
  // PascalCase
  const regexp = /^([A-Z][a-z]+){2,}$/
  if (!name) return false
  return regexp.test(name)
}

function pascalCaseToSnakeCase(str: string) {
  return str.split(/(?=[A-Z])/).join('_').toLowerCase()
}

function toDescription(str: string) {
  return str.split(/(?=[A-Z0-9])/).join(' ')
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

  framework: 'next' | 'nuxt' | undefined

  constructor(argv: string|string[], opts: TemplateOptions) {
    super(argv, opts)
    if (opts.framework) {
      this.config.set('framework', opts.framework)
      this.framework = opts.framework
    } else {
      this.framework = this.config.get('framework')
    }

    if (this.path !== this.destinationRoot()) {
      this.destinationRoot(this.path)
    }
  }

  async prompting() {
    // TODO: try and detect framework
    if (!this.framework) {
      await this.prompt([{
        type: 'list',
        name: 'framework',
        choices: ['next', 'nuxt'],
        message: 'framework',
        store: true,
      }]).then(({framework}) => {
        this.framework = framework
        this.config.set('framework', this.framework)
      })
    }

    const {library} = isValidPath(this.options.library) ? this.options : await inquirer.prompt([{
      type: 'text',
      name: 'library',
      default: 'slices',
      prefix: '🗂 ',
      message: 'Where should we create your new local library?',
      validate: (value: string) => {
        return (value && isValidPath(this.destinationPath(value))) || ('Invalid Path: ' + value)
      },
    }])

    const {sliceName} = validateSliceName(this.options.sliceName) ? this.options : await inquirer.prompt([{
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
      this.templatePath(path.join(this.framework || this.config.get('framework'), '**')),
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
      // fs.unlink(libIndex)
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
      this.fs.extendJSON(this.destinationPath('sm.json'), {libraries: [...libraries, libName]})
    }
  }
}

export interface SliceMachineConfig {
  libraries: Array<string>;
  _latest: string;
  apiEndpoint: string;
}
