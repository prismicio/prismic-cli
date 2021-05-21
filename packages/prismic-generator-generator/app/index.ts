import * as Generator from 'yeoman-generator'
import * as path from 'path'

export default class extends Generator {
  name: string | undefined;

  pm: 'npm' | 'yarn' | undefined;

  language: 'javascript'| 'typescript' | undefined;

  path: string | undefined

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
      this.name = await this.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'name of the generator',
          transformer: value => `generator-prismic-${value}`,
          validate: value => value ? true : 'required',
        },
      ]).then(res => `generator-prismic-${res.name}`)
    }

    if (!this.language) {
      this.language = await this.prompt([
        {
          type: 'list',
          name: 'lanaguage',
          default: 'javascript',
          choices: [
            {name: 'JavaScript', value: 'javascript'},
            {name: 'TypeScript', value: 'typescript'},
          ],
          message: 'Language',
        },
      ]).then(res => res.lanaguage)
    }

    if (!this.pm) {
      this.pm = await this.prompt([
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
  }

  async configuring() {
    this.destinationRoot(this.name)
  }

  async writing() {
    const template = path.join(this.language || 'javascript', '**')

    this.fs.copyTpl(
      this.templatePath(template),
      this.destinationPath(),
      {name: this.name},
    )

    this.moveDestination('_.gitignore', '.gitignore')
    this.moveDestination('_package.json', 'package.json')
    if (this.language === 'typescript') {
      this.moveDestination('_tsconfig.json', 'tsconfig.json')
    }
  }

  async install() {
    if (this.pm === 'yarn') {
      return this.yarnInstall()
    }
    return this.npmInstall()
  }
}
