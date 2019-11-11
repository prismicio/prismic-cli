import axios, { AxiosResponse } from 'axios'

import Config from './config'
import {
  BadRequestError, ForbiddenError, InternalServerError,
  UnauthorizedError, UnknownError
} from './error'

axios.defaults.maxRedirects = 0
axios.defaults.validateStatus = status => status < 500

const Communication = {
  async post(url: string, data: any, cookie?: string): Promise<any> {
    let options: any = {}

    if (cookie) options.headers = { Cookie: cookie }

    const response = await axios.post(url, data, options)
    const { status, statusText } = response
    if (status === 200 || ((Math.floor(status / 100)) === 3)) {
      await setCookie(response)
      return response.data
    } else switch (status) {
      case 400: throw (new BadRequestError(statusText))
      case 401: throw (new UnauthorizedError(statusText))
      case 403: throw (new ForbiddenError(statusText))
      case 500: throw (new InternalServerError(statusText))
      default: throw (new UnknownError(statusText))
    }
  },

  async get(url: string, cookie?: string): Promise<boolean> {
    const options: any = {}

    if (cookie) options.headers = { Cookie: cookie }

    const response = await axios.get(url, options)
    const { status, data } = response
    if (status === 200) await setCookie(response)
    return data
  },
}

async function setCookie(response: AxiosResponse) {
  const cookie = response.headers['set-cookie']
  if (cookie) await Config.set({ cookie: cookie[0] })
}

export default Communication
