import PrismicGenerator, { TemplateOptions } from '../base'

export default class NextJS extends PrismicGenerator {
  /* constructor(args: string | string[], opts: TemplateOptions) {
    super(args, opts)

    this.option('slicemachine', {
      type: Boolean,
      description: 'add slice-machine',
      alias: 'sm',
    })

    this.option('story-book', {
      type: Boolean,
      description: 'add story-book',
      alias: 'storybook',
    })
  } */

  async initializing() {
    this.destinationRoot(this.path)
    this.composeWith(require.resolve('../slicemachine'), {
      framework: 'next',
      domain: this.domain,
    })
  }

  async configuring() {
    // this.destinationRoot(this.path)
    // add additional templates for slicemachiine and story-book
  }

  async writing() {
    this.fs.copy(
      this.templatePath('**'),
      this.destinationPath(),
      {globOptions: {dot: true}}
    )

    const pkjJson = {
      name: this.domain,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        slicemachine: 'start-slicemachine --port 9999',
      },
      dependencies: {
        next: '10.0.2',
        react: '^16',
        'react-dom': '^16',
      },
    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkjJson)
  }

  async install() {
    this.npmInstall()
  }
}
