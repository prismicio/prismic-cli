import Config from './config'
import { Domain } from './helper'

const MagicLink = {
  /**
   * Returns a token from a response object
   * @param response The response object
   */
  parse(response: any): string {
    try {
      return JSON.parse(response).token
    } catch (_) { }
    return ''
  },
  /**
   * Returns the redirect url
   * @param repository The repository name
   * @param baseURL The base url
   */
  async buildRedirectUrl(repository: string, baseURL: string = Config.defaults.baseURL()) {
    const token = await Config.get('magicLink')
    const redirectUri = Domain.repository(repository, baseURL)
    if (token) {
      return `${baseURL}/magic?token=${token}&redirectUri=${redirectUri}`
    }
    return redirectUri
  }
}

export default MagicLink
