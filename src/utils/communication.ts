import got, { Options as GotOptions } from 'got'
import { IncomingHttpHeaders } from 'http2'

import Config from './config'
import {
  BadRequestError, ForbiddenError, InternalServerError,
  UnauthorizedError, UnknownError
} from './error'

const Communication = {
  async post(url: string, data: any, cookie?: string): Promise<any> {
    let options: GotOptions & { stream?: false | undefined } = {
      form: data, followRedirect: false, throwHttpErrors: false, headers: cookie ? { cookie } : {}
    }

    const { statusCode: status, statusMessage: message, body, headers } = (await got.post(url, options))
    if (status === 200 || ((Math.floor(status / 100)) === 3)) {
      await setCookie(headers)
      return body
    } else switch (status) {
      case 400: throw (new BadRequestError(message!))
      case 401: throw (new UnauthorizedError(message!))
      case 403: throw (new ForbiddenError(message!))
      case 500: throw (new InternalServerError(message!))
      default: throw (new UnknownError(message!))
    }
  },

  async get(url: string, cookie?: string): Promise<boolean> {
    const options: GotOptions & { stream?: false | undefined } = {
      headers: cookie ? { cookie } : {}
    }

    const { statusCode: status, body, headers } = (await got.get(url, options))
    if (status === 200) {
      await setCookie(headers)
      return body === 'true'
    }
    return false
  },
}

async function setCookie(headers: IncomingHttpHeaders) {
  const cookie = headers['set-cookie']
  if (cookie) await Config.set({ cookie: cookie[0] })
}

export default Communication
