import {GeneratorOptions} from 'yeoman-generator'
import PrismicGenerator, {TemplateOptions} from '../base'

export default class PrismicReact extends PrismicGenerator {
  constructor(argv: string | string[], opts: GeneratorOptions) {
    const options: TemplateOptions = {
      ...opts,
      source: 'https://github.com/prismicio/reactjs-starter/archive/master.zip',
      innerFolder: 'reactjs-starter-master',
      prismicConfig: 'src/prismic-configuration.js',
      branch: 'master',
    }
    super(argv, options)
  }

  writing() {
    return super.writing()
  }
}
