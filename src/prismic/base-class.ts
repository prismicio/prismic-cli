import {fs} from '../utils'
import * as path from 'path'
import * as cookie from 'cookie'
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

export default class Prismic {
  public configPath: string;

  public base: string;

  public cookies: string;

  constructor(config?: IConfig) {
    const home = config && config.home ? config.home : os.homedir()
    this.configPath = path.join(home, '.prismic')
    const {base, cookies} = getOrCreateConfig(this.configPath)
    this.base = base
    this.cookies = cookies
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

    return fs.writeFile(this.configPath, JSON.stringify(newConfig, null, '\t'), 'utf-8')
  }

  public async logout(): Promise<void> {
    return this.removeConfig()
  }

  private async setCookies(arr: Array<string> | undefined): Promise<void> {
    if (!arr || arr.length === 0) {
      return Promise.resolve()
    }

    const oldCookies = cookie.parse(this.cookies || '')

    const newCookies = arr.map(str => cookie.parse(str)).reduce((acc, curr) => {
      return {...acc, ...curr}
    }, {})

    const mergedCookie = Object.entries({...oldCookies, ...newCookies}).map(([key, value]) => {
      return cookie.serialize(key, value)
    }).join('; ')

    return this.updateConfig({base: this.base, cookies: mergedCookie})
  }

  axios(options?: AxiosRequestConfig): AxiosInstance {
    const headers = {Cookie: this.cookies, ...options?.headers}
    return Axios.create({
      baseURL: this.base,
      withCredentials: true,
      xsrfCookieName: 'X_XSRF',
      adapter: require('axios/lib/adapters/http'),
      ...options,
      ...headers,
    })
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
      return res
    })
  }
}
