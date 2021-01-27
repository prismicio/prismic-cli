import PrismicGenerator, { TemplateOptions } from '../base'
import * as path from 'path'

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

 async configuring() {
    this.destinationRoot(this.path)
    // add additional templates for slicemachiine and story-book
  }

  async writing() {
    this.fs.copy(
      this.templatePath('default/**'),
      this.destinationPath(),
      {globOptions: {dot: true}}
    )

    this.fs.copyTpl(
      this.templatePath('slicemachine/**'),
      this.destinationPath(),
      {domain: this.domain},
      undefined,
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

        // prismic sm --setup
        'prismic-javascript': '3',
        'prismic-reactjs': '1',
        'next-slicezone': '0',
        'next-transpile-modules': '6',
        'theme-ui': '0',
        'essential-slices': '1',
      },
      devDependencies: {
        // sm --setup
        '@babel/core': '^7.12.10',
        'slice-machine-ui': '^0.0.43',
      },

    }

    this.fs.extendJSON(this.destinationPath('package.json'), pkjJson)
  }

  async install() {
    this.npmInstall()
  }
}
