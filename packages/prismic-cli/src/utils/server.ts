import * as http from 'http'
import cli from 'cli-ux'
import {LogDecorations} from './logDecoration'
import * as hapi from '@hapi/hapi'

export const DEFAULT_PORT = 5555

export async function startServerAndOpenBrowser(
  url: string,
  base: string,
  port: number,
  logAction: string,
  setCookies: (cookies: ReadonlyArray<string>) => Promise<void>
):  Promise<void> {
  return new Promise( async ( resolve, reject ) => {
    const server = hapi.server({
      port,
      host: "localhost"
    } );

    server.route({
      method: 'POST',
      path: "/",
      options: {
        cors: {
          origin: [base],
          headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
        }
      },
      handler: async (request, h) => {
        try {
          const data: { email: unknown, cookies: ReadonlyArray<string> } | null = (() => {
            const payload = request.payload as any
            if(payload.email && payload.cookies) return payload as { email: unknown, cookies: ReadonlyArray<string> }
            return null
          })()

          if(!data) {
            cli.action.stop('It seems the server didn\'t respond properly, please contact us.')
            return h.response('Error with cookies').code(400)
          } else {
            try {
              await setCookies(data.cookies)
              cli.action.stop(`Logged in as ${data.email}`)
              resolve()
              return h.response(data).code(200)
            } catch(errorSetCookie) {
              cli.action.stop('It seems an error happened while setting your cookies.')
              reject(errorSetCookie)
              return h.response('Oops! Something wrong happened while logging.').code(500)
            }
          }
        } catch (err) {
          cli.action.stop('It seems an error happened while setting your cookies.')
          reject(err);
          return h.response('Oops! Something wrong happened while logging.').code(500)
        } finally {
          server.stop({ timeout: 10000 }).then(function (err: any) {
            process.exit((err) ? 1 : 0)
          })
        }
      }
    });
    
    server.route({
      method: ['GET','POST'],
      path: '/{any*}',
      handler: (request, h) => {
        return h.response(`not found: [${request.method}]: ${request.url.toString()}`).code(404)
      }
    });
    
    await server.start();

    cli.log('\nOpening browser to ' + LogDecorations.Underscore + url + LogDecorations.Reset)
    cli.action.start(logAction, 'Waiting for the browser response')
    cli.open(url)
  } );
};

export default startServerAndOpenBrowser
