import Communication from './communication'
import Config from './config'
import MagicLink from './magic-link'

async function sign(action: 'signup' | 'signin', credential: Credential, magic = false, baseURL: string) {
  const url = `${baseURL}/authentication/${action}${magic ? '?ml=true' : ''}`
  const response = await Communication.post(url, credential)
  if (magic) {
    // TODO: Test magic link parsing
    const token = await MagicLink.parse(response)
    if (token) {
      await Config.set({ magic: token })
    }
  }
}

const Auth = {
  async signin(credential: Credential, magic = false, baseURL: string = Config.defaults.baseURL()) {
    await sign('signin', credential, magic, baseURL)
  },
  async signup(credential: Credential, magic = false, baseURL: string = Config.defaults.baseURL()) {
    await sign('signup', credential, magic, baseURL)
  },
  async signout() {
    await Config.set({ cookie: '' })
    await Config.set({ magic: '' })
  },
  async isAuthenticated(): Promise<boolean> {
    try {
      return await Config.get('magic') || await Config.get('cookie')
    } catch (_) {
      return false
    }
  }
}

export default Auth
