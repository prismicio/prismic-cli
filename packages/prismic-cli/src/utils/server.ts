import cli from 'cli-ux'
import {LogDecorations} from './logDecoration'
import * as hapi from '@hapi/hapi'

export const DEFAULT_PORT = 5555

type HandlerData = { email: unknown, cookies: ReadonlyArray<string> }

const authenticationHandler = (server: hapi.Server) => (onSuccess: (data: HandlerData, msg: string) => Promise<void>, onFailure: (error: Error, msg: string) => void) => {
  return async (request: hapi.Request, h: hapi.ResponseToolkit) => {
    try {
      const data: HandlerData | null = (() => {
        const payload = request.payload as any
        if(payload.email && payload.cookies) return payload as { email: unknown, cookies: ReadonlyArray<string> }
        return null
      })()

      if(!data) {
        cli.action.stop('It seems the server didn\'t respond properly, please contact us.')
        return h.response('Error with cookies').code(400)
      } else {
        try {
          await onSuccess(data, `Logged in as ${data.email}`)
          return h.response(data).code(200)
        } catch(error) {
          onFailure(error, 'It seems an error happened while setting your cookies.')
          return h.response('Oops! Something wrong happened while logging.').code(500)
        }
      }
    } catch (err) {
      onFailure(err, 'It seems an error happened while setting your cookies.')
      return h.response('Oops! Something wrong happened while logging.').code(500)
    } finally {
      server.stop({ timeout: 10000 }).then(function (err: any) {
        process.exit((err) ? 1 : 0)
      })
    }
  }
}

export const Routes = {
  authentication: (server: hapi.Server) => (onSuccess: (data: HandlerData, msg: string) => Promise<void>, onFailure: (error: Error, msg: string) => void) => ({
    method: 'POST',
    path: "/",
    handler: authenticationHandler(server)(onSuccess, onFailure)
  }),

  notFound: {
    method: ['GET','POST'],
    path: '/{any*}',
    handler: (request: hapi.Request, h: hapi.ResponseToolkit) => {
      return h.response(`not found: [${request.method}]: ${request.url.toString()}`).code(404)
    }
  }
}

export const Server = {
  build: (base:string, port: number, host: string) => {
    const server = hapi.server({
      port,
      host,
      routes: {
        cors: {
          origin: [base],
          headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
        }
      }
    });
    return server
  }
}

export async function startServerAndOpenBrowser(
  url: string,
  base: string,
  port: number,
  logAction: string,
  setCookies: (cookies: ReadonlyArray<string>) => Promise<void>
):  Promise<void> {
  return new Promise( async ( resolve, reject ) => {

    async function onSuccess(data: HandlerData, msg: string) {
      await setCookies(data.cookies)
      cli.action.stop(msg)
      resolve()
    }

    function onFailure(error: Error, msg: string) {
      cli.action.stop(msg)
      reject(error)
    }

    const server = Server.build(base, port, 'localhost')
    server.route([Routes.authentication(server)(onSuccess, onFailure), Routes.notFound])

    await server.start();

    cli.log('\nOpening browser to ' + LogDecorations.Underscore + url + LogDecorations.Reset)
    cli.action.start(logAction, 'Waiting for the browser response')
    cli.open(url)
  } );
};

export default startServerAndOpenBrowser
