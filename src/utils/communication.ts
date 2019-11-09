import axios from 'axios'
import request = require('request')

import Config from './config'
import { ForbiddenError, InternalServerError, UnauthorizedError, UnknownError } from './error'

const Communication = {
  async post(url: string, data: any, cookies?: any): Promise<any> {
    let options: any = {
      method: 'POST',
      url,
      data,
      maxRedirects: 0,
      headers: {
        'X-Requested-With': 'XMLHTTPRequest'
      },
      validateStatus(status: number) {
        return status < 500
      }
    }
    if (cookies) {
      options = { ...options, withCredentials: true }
    }

    return new Promise((resolve, reject) => {
      axios(options).then(async data => {
        const status = data.status
        if (status === 200 || ((Math.floor(status / 100)) === 3)) {
          const cookie = data.headers['set-cookie']
          if (cookie) {
            await Config.set({ cookies: cookie[0] })
            return resolve(data)
          }
        } else switch (status) {
          case 401: return reject(new UnauthorizedError(data.statusText))
          case 403: return reject(new ForbiddenError(data.statusText))
          default: return reject(new InternalServerError(data.statusText))
        }
      }).catch(error => new UnknownError(error))
    })
  },

  async get(url: string, cookies?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const options: any = {}
      if (cookies) {
        options.headers = { cookie: cookies }
      }
      request.get(url, options, (err, xhr, body) => {
        if (err) {
          reject(err)
          return
        }
        if (xhr.statusCode === 200) {
          const setCookies = xhr.headers['set-cookie']
          if (setCookies) {
            Config.set({ cookies: setCookies[0] }).then(() => {
              resolve(body === 'true')
            }).catch(error => reject({ error }))
          } else resolve(body === 'true')
          return
        }
        reject()
      })
    })
  },
}

export default Communication
