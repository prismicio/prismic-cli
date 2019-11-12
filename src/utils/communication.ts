import got, { Options as GotOptions, Response } from 'got'

import Config from './config'
import {
  BadRequestError, ForbiddenError, InternalServerError,
  UnauthorizedError, UnknownError
} from './error'

const Communication = {
  async post(url: string, data: any, cookie?: string): Promise<any> {
    let options: GotOptions & { stream?: false | undefined } = {}

    if (cookie) options.headers = { cookie }
    options.form = data
    options.followRedirect = false
    const response = (await got.post(url, options))
    const { statusCode: status, statusMessage: message } = response
    if (status === 200 || ((Math.floor(status / 100)) === 3)) {
      await setCookie(response)
      return response.body
    } else switch (status) {
      case 400: throw (new BadRequestError(message!))
      case 401: throw (new UnauthorizedError(message!))
      case 403: throw (new ForbiddenError(message!))
      case 500: throw (new InternalServerError(message!))
      default: throw (new UnknownError(message!))
    }
  },

  async get(url: string, cookie?: string): Promise<boolean> {
    const options: any = {}

    if (cookie) options.headers = { cookie }

    const response = (await got.get(url, options))
    const { statusCode: status, body } = response
    if (status === 200) {
      await setCookie(response)
      return body === 'true'
    }
    return false
  },
}

async function setCookie(response: Response) {
  const cookie = response.headers['set-cookie']
  if (cookie) await Config.set({ cookie: cookie[0] })
}

export default Communication
