// see https://github.com/oclif/oclif/blob/master/src/generators/app.ts
import {GeneratorOptions} from 'yeoman-generator'
import PrismicGenerator, {TemplateOptions} from '../base'

export default class PrismicReact extends PrismicGenerator {
  constructor(argv: string | string[], opts: GeneratorOptions) {
    const options: TemplateOptions = {
      ...opts,
      source: 'https://github.com/prismicio/nodejs-sdk/archive/master.zip',
      innerFolder: 'nodejs-sdk-master',
      prismicConfig: 'prismic-configuration.js',
      branch: 'master',
    }
    super(argv, options)
  }

  writing() {
    return super.writing()
  }
}
