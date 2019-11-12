import { Authentication } from '../interfaces/auth'
import { RepositoryOptions } from '../interfaces/repository'

import Communication from './communication'
import Config from './config'

const Repository = {
  async createWithToken(name: string, token: string | undefined, options: RepositoryOptions) {
    const matches = options.baseURL.match(/(https?:\/\/)(.*)/)
    const protocol = matches![1]
    const platform = matches![2]
    const url = `${protocol}api.${platform}/management/repositories?access_token=${token}`
    const data: any = { domain: name, plan: 'personal', isAnnual: 'false' }

    if (options.documents) {
      data.signature = options.documents.signature
      data.documents = JSON.stringify(options.documents.data)
    }

    if (options.users) {
      data.users = options.users
    }

    return Communication.post(url, data)
  },

  async createWithCookie(name: string, cookie: string | undefined, options: RepositoryOptions) {
    const url = `${options.baseURL}/authentication/newrepository`
    const data: any = { domain: name, plan: 'personal', isAnnual: 'false' }
    if (options.types) {
      data['custom-types'] = JSON.stringify(options.types)
    }

    if (options.documents) {
      data.signature = options.documents.signature
      data.documents = JSON.stringify(options.documents.data)
    }

    if (options.users) {
      data.users = options.users
    }

    return Communication.post(url, data, cookie)
  },

  async create(name: string, method: 'token' | 'cookie' = 'token', options: RepositoryOptions & Authentication) {
    try {
      if (method === 'token') {
        return this.createWithToken(name, options.token, options)
      }

      if (method === 'cookie') {
        return this.createWithCookie(name, options.cookie, options)
      }
    } catch (error) {
      if (error.status === 401) {
        await Config.set({ cookie: '' })
        return this.createWithCookie(name, options.cookie, options)
      }
      throw error
    }
  }
}

export default Repository
