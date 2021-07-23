import * as http from 'http'
import cli from 'cli-ux'
import {LogDecorations} from './logDecoration'

export const DEFAULT_PORT = 5555

export const handleRequest = (base: string, logAction: string, cb: (err?: null | Error, d?: {cookies: Array<string>; email?: string}) => any) => (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', base)
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Request-Method', 'POST')
    res.end()
  } else if (req.method === 'POST') {
    cli.action.start(logAction, 'Receiving authentication information')

    let data = ''
    req.on('data', chunk => {
      data += chunk
    })

    req.on('end', () => {
      const {email, cookies} = JSON.parse(data) as { email?: string; cookies?: Array<string> }
      if (!email || !cookies) {
        cli.action.stop('It seems the server didn\'t respond properly, please contact us.')
        res.statusCode = 400
        res.end(() => cb(new Error('Error with cookies')))
      } else {
        res.statusCode = 200
        res.end(() => cb(null, {cookies, email}))
      }
      // cli.action.stop(`Logged in as ${email}`)
    })
  } else {
    res.statusCode = 404
    res.end(() => cb(new Error(`not found: [${req.method}]: ${req.url}`)))
  }
}

export async function startServerAndOpenBrowser(
  url: string,
  base: string,
  port: number,
  logAction: string,
  setCookies: (cookies?: Array<string>) => Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest(base, logAction, (error, user) => {
      if (error || !user || !user.cookies) reject(error)

      return setCookies(user?.cookies)
      .then(() => {
        cli.action.stop(`Logged in as ${user?.email}`)
        server.close(error2 => {
          if (error) return reject(error2)
          resolve()
        })
      })
      .catch(error2 => {
        cli.action.stop('It seems an error happened while setting your cookies.')
        console.error(error2)
      })
    }))

    server.on('error', error2 => {
      console.error(error2)
      cli.action.stop()
      server.close(() => reject(error2))
    })

    server.keepAliveTimeout = 1
    server.timeout = 1

    server.listen(port, () => {
      cli.log('\nOpening browser to ' + LogDecorations.Underscore + url + LogDecorations.Reset)
      cli.action.start(logAction, 'Waiting for the browser response')
      cli.open(url)
    })
  })
}

export default startServerAndOpenBrowser
