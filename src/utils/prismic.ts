const prismic = require('prismic.io')

import PrismicConfig from '../prismic.config'

import Communication from './communication'
import config from './config'
const Prismic = {
  getApi(): any {
    return prismic.api(PrismicConfig.apiEndpoint)
  },
  async isRepositoryAvailable(repository: string, base: string = config.defaults.baseURL()) {
    return Communication.get(`${base}/app/dashboard/repositories/${repository}/exists`)
  }
}

export default Prismic
