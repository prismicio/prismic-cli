import * as Generator from 'yeoman-generator'

export default class extends Generator {
  name: string | undefined;

  pm: 'npm' | 'yarn' | undefined;

  constructor(argv: string | string[], opts: Generator.GeneratorOptions) {
    super(argv, opts)
    this.name = opts.name
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
    this.fs.copyTpl(
      this.templatePath('**'),
      this.destinationPath(),
      {name: this.name},
    )

    this.moveDestination('_.gitignore', '.gitignore')
    this.moveDestination('_tsconfig.json', 'tsconfig.json')
    this.moveDestination('_package.json', 'package.json')
  }

  async install() {
    if (this.pm === 'yarn') {
      return this.yarnInstall()
    }
    return this.npmInstall()
  }
}
