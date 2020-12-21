import {GeneratorOptions} from 'yeoman-generator'
import PrismicGenerator, {TemplateOptions} from '../base'

export default class PrismicReact extends PrismicGenerator {
  constructor(argv: string | string[], opts: GeneratorOptions) {
    const options: TemplateOptions = {
      ...opts,
      source: 'https://github.com/prismicio/vuejs-starter/archive/master.zip',
      innerFolder: 'vuejs-starter-master',
      prismicConfig: 'public/index.html',
      branch: 'master',
    }
    super(argv, options)
  }

  writing() {
    return super.writing()
  }
}
