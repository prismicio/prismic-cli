import {fs} from '../utils'
import * as path from 'path'
import * as cookie from '../utils/cookie'
import Axios, {AxiosInstance, AxiosResponse, AxiosRequestConfig} from 'axios'
import * as qs from 'qs'
import * as os from 'os'
import {IConfig} from '@oclif/config'
import {parseJsonSync} from '../utils'

// Note to self it's easier to mock fs sync methods.

export interface LoginData {
  email?: string;
  password?: string;
  oauthaccesstoken?: string;
  base?: string;
}

export interface LocalDB {
  base: string;
  cookies: string;
  oauthAccessToken?: string;
}

export type Apps = 'slicemachine' | '' | null | undefined

export interface CreateRepositoryArgs {
  domain: string;
  app?: Apps;
  customTypes?: any;
  signedDocuments?: any;
}

export const DEFAULT_CONFIG: LocalDB = {base: 'https://prismic.io', cookies: ''}

export function createDefaultConfig(configPath: string): string {
  const str: string = JSON.stringify(DEFAULT_CONFIG, null, '\t')
  fs.writeFileSync(configPath, str, 'utf-8')
  return str
}

export function getOrCreateConfig(configPath: string): LocalDB {
  try {
    const configAsString = fs.readFileSync(configPath, 'utf-8')
    const confAsJson = parseJsonSync<LocalDB>(configAsString)
    return {...DEFAULT_CONFIG, ...confAsJson}
  } catch (error) {
    if (error.code === 'ENOENT') {
      // file does not exists create on and return the config in a promise.
      createDefaultConfig(configPath)
      return DEFAULT_CONFIG
    }
    throw error
  }
}

export interface AxiosInstanceOptions extends AxiosRequestConfig {
  secure?: boolean;
}

export default class Prismic {
  public configPath: string;

  public base: string;

  public cookies: string;

  public oauthAccessToken?: string;

  constructor(config?: IConfig) {
    const home = config && config.home ? config.home : os.homedir()
    this.configPath = path.join(home, '.prismic')
    const {base, cookies, oauthAccessToken} = getOrCreateConfig(this.configPath)
    this.base = base
    this.cookies = cookies
    this.oauthAccessToken = oauthAccessToken
  }

  private getConfig(): LocalDB {
    return getOrCreateConfig(this.configPath)
  }

  private async removeConfig(): Promise<void> { // maybe change void to this to make things chainable
    return fs.unlink(this.configPath)
  }

  private async updateConfig(data: Partial<LocalDB>): Promise<void> {
    const oldConfig = this.getConfig()
    const newConfig: LocalDB = {...oldConfig, ...data}
    this.base = newConfig.base // || 'https://prismic.io'
    this.cookies = newConfig.cookies
    this.oauthAccessToken = newConfig.oauthAccessToken

    return fs.writeFile(this.configPath, JSON.stringify(newConfig, null, '\t'), 'utf-8')
  }

  public async logout(): Promise<void> {
    return this.removeConfig()
  }

  private async setCookies(arr: Array<string> = []): Promise<void> {
    const oldCookies = cookie.parse(this.cookies || '')

    const newCookies = arr.map(str => cookie.parse(str)).reduce((acc, curr) => {
      return {...acc, ...curr}
    }, {})

    console.log({ newCookies })

    const mergedCookie = Object.entries({...oldCookies, ...newCookies}).map(([key, value]) => {
      return cookie.serialize(key, value)
    }).join('; ')
    /* console.log("setCookies")
    console.log({arr, oldCookies, newCookies, mergedCookie, cookies: this.cookies}) */

    return this.updateConfig({base: this.base, cookies: mergedCookie})
  }

  axios(options?: AxiosInstanceOptions): AxiosInstance {
    const headers = {Cookie: this.cookies, ...options?.headers}
    const opts: AxiosRequestConfig = {
      baseURL: this.base,
      // withCredentials: true,
      // xsrfCookieName: 'X_XSRF',
      adapter: require('axios/lib/adapters/http'),
      ...options,
      headers,
    }
    // TODO: optionaly add the x_xsrf (_) parmeter to the query ie: ?_=my_x_xsrf_token
    return Axios.create(opts)
  }

  public async login(data: LoginData): Promise<AxiosResponse | void> {
    const {base, email, password, oauthaccesstoken} = data
    const params = oauthaccesstoken ? {oauthaccesstoken} : {email, password}
    if (base) {
      this.base = base
    }

    return this.axios().post('/authentication/signin', qs.stringify(params), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    })
    .then((res: AxiosResponse) => {
      this.setCookies(res.headers['set-cookie'])
      console.log(res)
      return res
    })
  }

  public async isAuthenticated(): Promise<boolean> {
    if (this.oauthAccessToken) return Promise.resolve(true) // TODO: check this some how
    if (!this.cookies) return Promise.resolve(false)
    const cookies = cookie.parse(this.cookies)
    if (!cookies.SESSION) return Promise.resolve(false)
    if (!cookies.prismic_auth) return Promise.resolve(false)
    return Promise.resolve(true) // TODO: check this some how
  }

  public async validateRepositoryName(name?: string): Promise<string> {
    if (!name) return Promise.reject(new Error('subdomain name is required'))
    const domain = name.toLocaleLowerCase().trim()
    const allowedChars = /^[a-zA-Z0-9][-a-zA-Z0-9]{2,}[a-zA-Z0-9]/

    if (domain.length < 4) return Promise.reject(new Error('subdomain must be four or more characters long'))
    if (domain[0] === '-') return Promise.reject(new Error('must not start with a hyphen'))
    if (allowedChars.test(domain) === false) return Promise.reject(new Error('alphanumerical and hyphens only'))
    // any other rules ?

    const url = `/app/dashboard/repositories/${domain}/exists`
    return this.axios().get<boolean>(url).then(res => {
      if (!res.data) return Promise.reject(new Error(`${domain} is already in use`))
      return domain
    })
  }

  public async createRepository(args: CreateRepositoryArgs): Promise<AxiosResponse> {
    await this.isAuthenticated()

    if (this.oauthAccessToken) return this.createRepositoryWithToken(args)

    return this.createRepositoryWithCookie(args)
  }

  private async createRepositoryWithCookie({
    domain,
    app,
  }: CreateRepositoryArgs): Promise<AxiosResponse> {
    const data = {domain, plan: 'personal', isAnnual: 'false', app}
    return this.axios().post('/authentication/newrepository', qs.stringify(data), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    })
  }

  private async createRepositoryWithToken({
    domain,
    app,
  }: CreateRepositoryArgs): Promise<AxiosResponse> {
    const data = {domain, plan: 'personal', isAnnual: 'false', app, access_token: this.oauthAccessToken}
    const url = new URL(this.base)
    url.hostname = `api.${url.hostname}`
    url.pathname = '/management/repositories'

    const address = url.toString()
    return this.axios().post(address, qs.stringify(data), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    })
  }
}
