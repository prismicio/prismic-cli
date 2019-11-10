import Communication from './communication'
import Config from './config'
import MagicLink from './magic-link'

async function sign(action: 'signup' | 'signin', credential: Credential, magicLink = false, baseURL: string) {
  const url = `${baseURL}/authentication/${action}${magicLink ? '?ml=true' : ''}`
  const response = await Communication.post(url, credential)
  if (magicLink) {
    // TODO: Test magic link parsing
    const token = await MagicLink.parse(response)
    if (token) {
      await Config.set({ magicLink: token })
    }
  }
}

const Auth = {
  async singin(credential: Credential, magicLink = false, baseURL: string = Config.defaults.baseURL()) {
    await sign('signin', credential, magicLink, baseURL)
  },
  async singup(credential: Credential, magicLink = false, baseURL: string = Config.defaults.baseURL()) {
    await sign('signup', credential, magicLink, baseURL)
  },
  async signout() {
    await Config.set({ cookie: '' })
  },
  async isAuthenticated(method: 'cookie' | 'magic' = 'cookie'): Promise<boolean> {
    try {
      const cookies = method === 'cookie' ? (await Config.get('cookie')) : (await Config.get('magicLink'))
      return !!cookies
    } catch (_) {
      return false
    }
  }
}

export default Auth
