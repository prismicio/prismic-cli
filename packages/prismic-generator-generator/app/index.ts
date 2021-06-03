import * as Generator from 'yeoman-generator'
import * as path from 'path'
import * as inquirer from 'inquirer'
export default class extends Generator {
  name: string | undefined;

  pm: 'npm' | 'yarn' | undefined;

  language: 'javascript'| 'typescript' | undefined;

  path: string | undefined

  slicemachine: boolean | undefined

  constructor(argv: string | string[], opts: Generator.GeneratorOptions) {
    super(argv, opts)
    this.pm = opts.pm
    this.name = opts.name
    this.language = opts.language
    this.path = opts.path
  }

  async initializing() {
    if (this.path) this.destinationRoot(this.path)
  }

  async prompting() {
    if (!this.name) {
      this.name = await inquirer.prompt<{name: string}>([
        {
          type: 'input',
          name: 'name',
          message: 'name of the generator',
          transformer: value => `generator-prismic-${value}`,
          validate: value => value ? true : 'required',
        },
      ]).then(res => res.name.trim())
    }

    if (!this.language) {
      this.language = await inquirer.prompt<{language: 'javascript' | 'typescript'}>([
        {
          type: 'list',
          name: 'language',
          default: 'javascript',
          choices: [
            {name: 'JavaScript', value: 'javascript'},
            {name: 'TypeScript', value: 'typescript'},
          ],
          message: 'Language',
        },
      ]).then(res => res.language)
    }

    if (!this.pm) {
      this.pm = await inquirer.prompt<{pm: 'npm' | 'yarn'}>([
        {
          type: 'list',
          name: 'pm',
          message: 'package manager',
          choices: [
            {
              name: 'Yarn',
              value: 'yarn',
            },
            {
              name: 'Npm',
              value: 'npm',
            },
          ],
        },
      ]).then(res => res.pm)
    }

    if (!this.slicemachine) {
      this.slicemachine = await inquirer.prompt<{slicemachine: boolean}>([{
        type: 'confirm',
        name: 'slicemachine',
        message: 'Support SliceMachine',
        default: true,
      }]).then(res => res.slicemachine)
    }
  }

  async configuring() {
    this.destinationRoot(`generator-prismic-${this.name}`)
  }

  async writing() {
    const template = path.join(this.language || 'javascript', '**')
    const opts = {
      name: this.name,
      packageName: `generator-prismic-${this.name}`,
      slicemachine: this.slicemachine,
    }

    this.fs.copyTpl(
      this.templatePath(template),
      this.destinationPath(),
      opts,
    )

    this.moveDestination('_.gitignore', '.gitignore')
    this.moveDestination('_package.json', 'package.json')
    if (this.language === 'typescript') {
      this.moveDestination('_tsconfig.json', 'tsconfig.json')
    }

    if (!this.slicemachine) {
      this.deleteDestination(path.join('generators', 'slicemachine'))
      this.deleteDestination(path.join('generators', 'create-slice'))
      this.deleteDestination(path.join('generators', 'storybook'))
    }
  }

  async install() {
    if (this.pm === 'yarn') {
      return this.yarnInstall()
    }
    return this.npmInstall()
  }
}
