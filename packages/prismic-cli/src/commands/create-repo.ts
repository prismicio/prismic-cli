import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import {AxiosResponse} from 'axios'
import {Command} from '../prismic'

export default class CreateRepo extends Command {
  static description = 'Create a new prismic repository.'

  static flags = {
    help: flags.help({char: 'h'}),

    domain: flags.string({
      char: 'd',
      description: 'name of the prismic repository ie: example, becomes https://example.prismic.io',
      parse: (input: string) => input.toLowerCase().trim(),
    }),
  }

  static args = []

  async run() {
    const isAuthenticated = await this.prismic.isAuthenticated()

    if (!isAuthenticated) {
      await this.login()
    }

    const {flags} = this.parse(CreateRepo)

    const domain = await this.validateDomain(flags.domain)

    cli.action.start('Creating prismic repository')
    return this.prismic.createRepository({
      domain: domain,
      framework: 'other',
    })
    .then((res: AxiosResponse<any>) => {
      cli.action.stop()
      const url = new URL(this.prismic.base)
      url.host = `${res.data || domain}.${url.host}`
      this.log(`A new repository has been created at: ${url.toString()}`)
    })
  }
}
