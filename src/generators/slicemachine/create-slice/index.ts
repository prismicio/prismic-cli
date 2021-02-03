import * as Generator from 'yeoman-generator'
import * as isValidPath from 'is-valid-path'
import * as path from 'path'

function validateSliceName(name: string): boolean {
  // PascalCase
  const regexp = /^([A-Z][a-z]+){2,}$/
  return regexp.test(name)
}

function pascalCaseToSnakeCase(str: string) {
  return str.split(/(?=[A-Z])/).join('_').toLowerCase()
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
    this.answers = await this.prompt([
      {
        type: 'text',
        name: 'library',
        default: 'slices',
        prefix: '🗂 ',
        message: 'Where should we create your new local library?',
        validate: (value: string) => {
          return isValidPath(this.destinationPath(value)) || 'Invalid Path'
        },
      },
      {
        type: 'text',
        name: 'sliceName',
        message: 'Enter the name of your slice (2 words, PascalCased)',
        default: this.options.sliceName || 'MySlice',
        validate: validateSliceName, // change validation to check for the slice as well.
      },
    ])
  }

  async configuring() {
    /* maybe load update sm.json */
    // TODO: test this on an existing project
    // const pkJson = this.readDestinationJSON('package.json')
    // const smVersion = /\d.*/g.exec(pkJson.devDependencies['slicemachine-ui']) 
    // const smJson = this.readDestinationJSON('sm.json', {})

  }

  async writing() {

    // const smFile = this.readDestinationJSON('sm.json', {libraries: []})

    const libName = path.join('@', this.answers.library)


    const {libraries} = this.readDestinationJSON('sm.json', {libraries: []}) as unknown as SliceMachineConfig

    if (libraries.includes(libName) === false) {
      this.fs.extendJSON('sm.json', {libraries: [...libraries, libName]})
    }

    const pathToLib = path.join(this.answers.library, this.answers.sliceName)

    // copy the template file
    // TODO: check if libaray exists first then modify the index.
    this.copyTemplate('index.js', path.join(this.answers.library, 'index.js'), undefined, {
      sliceName: this.answers.sliceName,
    })

    // load the mocks and models
    this.copyTemplate('default/**', pathToLib, undefined, {
      sliceName: this.answers.sliceName,
      sliceType: this.answers.sliceType,
    })

    this.copyTemplate(path.join(this.options.framework, '**'), pathToLib, undefined, {
      sliceName: this.answers.sliceName,
      sliceType: this.answers.sliceType,
    })
  }

  async conflicts() {
    /* handel confilicts with sm.json */
    // TODO: conflicts can happen with index.js and sm.jsons
  }
}

export interface SliceMachineConfig {
  libraries: Array<string>;
  _latest: string;
  apiEndpoint: string;
}