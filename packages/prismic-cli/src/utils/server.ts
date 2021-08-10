import cli from 'cli-ux'
import {LogDecorations} from './logDecoration'
import * as hapi from '@hapi/hapi'

export const DEFAULT_PORT = 5555

type HandlerData = { email: unknown; cookies: ReadonlyArray<string> }

function validatePayload(payload: any): HandlerData | null {
  if (!payload) return null
  if (!payload.email || !payload.cookies) return null
  if (!(Array.isArray(payload.cookies))) return null
  if (payload.cookies.some((c: any) => typeof c !== 'string')) return null

  return payload as HandlerData
}

const authenticationHandler = (server: hapi.Server) => (cb: (data: HandlerData) => Promise<void>) => {
  return async (request: hapi.Request, h: hapi.ResponseToolkit) => {
    try {
      const data: HandlerData | null = validatePayload(request.payload)

      if (!data) {
        cli.action.stop('It seems the server didn\'t respond properly, please contact us.')
        return h.response('Error with cookies').code(400)
      }
      await cb(data)
      return h.response(data).code(200)
    } finally {
      await server.stop({timeout: 10000})
    }
  }
}

export const Routes = {
  authentication: (server: hapi.Server) => (cb: (data: HandlerData) => Promise<void>) => ({
    method: 'POST',
    path: '/',
    handler: authenticationHandler(server)(cb),
  }),

  notFound: {
    method: ['GET', 'POST'],
    path: '/{any*}',
    handler: (request: hapi.Request, h: hapi.ResponseToolkit) => {
      return h.response(`not found: [${request.method}]: ${request.url.toString()}`).code(404)
    },
  },
}

export const Server = {
  build: (base: string, port: number, host: string) => {
    const server = hapi.server({
      port,
      host,
      routes: {
        cors: {
          origin: [base],
          headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
        },
      },
    })
    return server
  },
}

export async function startServerAndOpenBrowser(
  url: string,
  base: string,
  port: number,
  logAction: string,
  setCookies: (cookies: ReadonlyArray<string>) => Promise<void>,
):  Promise<void> {
  return new Promise(resolve => {
    async function callback(data: HandlerData) {
      await setCookies(data.cookies)
      cli.action.stop(`Logged in as ${data.email}`)
      resolve()
    }

    const server = Server.build(base, port, 'localhost')
    server.route([Routes.authentication(server)(callback), Routes.notFound])

    server.start()
    .then(() => {
      cli.log('\nOpening browser to ' + LogDecorations.Underscore + url + LogDecorations.Reset)
      cli.action.start(logAction, 'Waiting for the browser response')
      cli.open(url)
    })
  })
}

export default startServerAndOpenBrowser
