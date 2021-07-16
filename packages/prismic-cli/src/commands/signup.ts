import {flags} from '@oclif/command'
import {Command} from '../prismic'
import cli from 'cli-ux'
import * as Koa from 'koa'
import { DEFAULT_PORT, Server } from '../utils/server'
import Prismic from '../prismic/communication'
import { LogDecorations, PRISMIC_LOG_HEADER } from '../utils/logDecoration'

const logAction: string = PRISMIC_LOG_HEADER + 'Signing in'
export default class Signup extends Command {
  static description = 'Create a prismic account'

  static flags = {
    help: flags.help({char: 'h'}),

    base: flags.string({
      name: 'base',
      hidden: true,
      description: 'base url to signup with',
      default: 'https://prismic.io',
    }),

    port: flags.integer({
      name: 'port',
      hidden: false,
      description: 'port to start the local login server',
      default: DEFAULT_PORT
    })
  }

  private handleLogin(prismic: Prismic): (ctx: Koa.Context) => Promise<any> {
    return async (ctx: Koa.Context): Promise<any> => {
      cli.action.start(logAction, 'Receiving authentication information')
      Server.stop()

      const { email, cookies } = ctx.request.body as { email?: string, cookies?: Array<string> }
      if (!email || !cookies) {
        cli.action.stop('It seems the server didn\'t respond properly, please contact us.')
        return ctx.throw(400)
      }

      return prismic.setCookies(cookies)
        .then(() => {
          cli.action.stop(`Logged in as ${email}`)
          return ctx.status = 200
        })
        .catch(() => {
          cli.action.stop(`It seems an error happened while setting your cookies.`)
          return ctx.throw(400)
        })
      }
  }

  async run() {
    const {flags} = this.parse(Signup)
    const {base, port} = flags

    // ask confirmation
    const confirmationMessage = PRISMIC_LOG_HEADER + 'Press any key to open up the browser to signup or ' + LogDecorations.FgRed + 'q' + LogDecorations.Reset + ' to exist'
    const confirmationKey: string = await cli.prompt(confirmationMessage, { type: 'single', required: true })
    if (confirmationKey === 'q') return

    const loginUrl: string = `${base}/dashboard/cli/signup?port=${port}`

    // Start the server
    Server.start(base, port, this.handleLogin(this.prismic))

    // Opening browser
    cli.log('\nOpening browser to ' + LogDecorations.Underscore + loginUrl + LogDecorations.Reset)
    cli.action.start(logAction, 'Waiting for the browser response')

    cli.open(loginUrl)
  }
}
