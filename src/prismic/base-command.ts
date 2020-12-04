import {Command} from '@oclif/command'
import {IConfig} from '@oclif/config'
import Prismic from './base-class'

export default abstract class PrismicCommand extends Command {
  prismic: Prismic;

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.prismic = new Prismic(config)
  }

  async catch(err: any): Promise<any> {
    // TODO: add sentry here
    super.catch(err)
  }
}
