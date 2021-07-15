import {flags} from '@oclif/command'
import {Command} from '../prismic'
import cli from 'cli-ux'
import * as Koa from 'koa';
import { Server } from '../utils/server';
import Prismic from '../prismic/communication';

const DEFAULT_PORT = 5555;
type LoginResponse = {
  email: string,
  cookies: Array<string>
}

export default class Login extends Command {
  static description = 'Login to prismic'

  static flags = {
    ...Command.flags,
    help: flags.help({char: 'h'}),
    base: flags.string({
      name: 'base',
      hidden: true,
      description: 'base url to authenticate with',
      default: 'https://prismic.io',
    }),
    port: flags.integer({
      name: 'port',
      hidden: false,
      description: 'port to start the local login server',
      default: DEFAULT_PORT
    })
  }

  static args = []

  private handleLogin(prismic: Prismic): (ctx: Koa.Context) => Promise<any> {
    return async (ctx: Koa.Context): Promise<any> => {
      cli.action.start('Logging in', 'Receiving authentication information');

      const { email, cookies } = ctx.request.body as LoginResponse
      if (!email || !cookies) {
        cli.action.stop("It seems the server didn't respond properly, please contact us.")
        ctx.status = 400;
        return cli.exit();
      };

      return prismic.setCookies(cookies)
        .then(() => {
          cli.action.stop(`Logged in as ${email}`)
          return ctx.status = 200
        })
        .catch(() => {
          cli.action.stop(`It seems an error happened while setting your cookies.`)
          return ctx.throw(400);
        })
      }
  }

  async run() {
    const {flags} = this.parse(Login)
    const {base, port} = flags

    // ask confirmation
    const confirmationKey: string = await cli.prompt('Press any key to open up the browser to login or q to exist', { type: 'single', required: true })
    if (confirmationKey === 'q') return

    const loginUrl: string = `${base}/dashboard/cli/login?port=${port}`

    // Start the server
    Server.start(base, port, this.handleLogin(this.prismic));

    // Opening browser
    cli.log(`\nOpening browser to -> ${loginUrl}`);
    cli.action.start('Logging in', 'waiting for the browser response')

    cli.open(loginUrl);
  }
}
