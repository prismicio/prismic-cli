import {fs} from '../utils'
import * as path from 'path'
import * as cookie from '../utils/cookie'
import Axios, {AxiosInstance, AxiosResponse, AxiosRequestConfig} from 'axios'
import * as qs from 'qs'
import * as os from 'os'
import {IConfig} from '@oclif/config'
import {parseJsonSync} from '../utils'
import cli from 'cli-ux'
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

export interface CustomTypeMetaData {
  id: string;
  name: string;
  repeatable: string;
  value: string;
}

export interface CustomType {
  id: string;
  name: string;
  repeatable: string;
  value: any;
}

export interface CreateRepositoryArgs {
  domain: string;
  app?: Apps;
  customTypes?: Array<CustomType>;
  signedDocuments?: Documents;
}

export interface Document {
  [key: string]: any;
}

export interface Documents {
  signature: string;
  documents: Document;
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

    const mergedCookie = Object.entries({...oldCookies, ...newCookies}).map(([key, value]) => {
      return cookie.serialize(key, value)
    }).join('; ')

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
      return res
    })
  }

  public async isAuthenticated(): Promise<boolean> {
    // TODO: find out if there is an refresh endpoint in prismic.io
    if (this.oauthAccessToken) return Promise.resolve(true) // TODO: check this some how
    if (!this.cookies) return Promise.resolve(false)
    const cookies = cookie.parse(this.cookies)
    if (!cookies.SESSION) return Promise.resolve(false)
    // if (!cookies['prismic-auth']) return Promise.resolve(false)
    return Promise.resolve(true) // TODO: check this some how
  }

  private async reAuthenticate() {
    const email =  await cli.prompt('Email')
    const password =  await cli.prompt('Password', {type: 'hide'})
    return this.login({email, password}).catch(() => this.reAuthenticate)
  }

  public async validateRepositoryName(name?: string): Promise<string> {
    if (!name) return Promise.reject(new Error('repository name is required'))

    const domain = name.toLocaleLowerCase().trim()

    /* const allowedChars = /^[a-zA-Z0-9][-a-zA-Z0-9]{2,}[a-zA-Z0-9]$/
    if (domain.length < 4) return Promise.reject(new Error('subdomain must be four or more characters long'))
    if (domain[0] === '-') return Promise.reject(new Error('must not start with a hyphen'))
    if (allowedChars.test(domain) === false) return Promise.reject(new Error('alphanumerical and hyphens only'))
    */
    // any other rules ?

    const errors = []

    const startsWithLetter = /^[a-z]/.test(domain)
    if (!startsWithLetter) errors.push('Must start with a letter.')

    const acceptedChars = /^[a-z0-9-]+$/.test(domain)
    if (!acceptedChars) errors.push('Must contain only letters, numbers and hyphens.')

    const fourCharactersOrMore = domain.length >= 4
    if (!fourCharactersOrMore) errors.push('Must have four or more alphanumeric characters and/or hyphens.')

    const endsWithALetterOrNumber = /[a-z0-9]$/.test(domain)
    if (!endsWithALetterOrNumber) errors.push('Must end in a letter or a number.')

    if (errors.length > 0) {
      const errorString = errors.map((d, i) => `(${i + 1}: ${d}`).join(' ')
      const msg = `Validation errors: ${errorString}`
      return Promise.reject(new Error(msg))
    }

    const url = `/app/dashboard/repositories/${domain}/exists`
    return this.axios().get<boolean>(url).then(res => {
      if (!res.data) return Promise.reject(new Error(`${domain} is already in use`))
      return domain
    })
  }

  public async createRepository(args: CreateRepositoryArgs): Promise<AxiosResponse> {
    const hasAuth = await this.isAuthenticated()

    if (!hasAuth) {
      await this.reAuthenticate()
    }

    return (
      this.oauthAccessToken ? this.createRepositoryWithToken(args) : this.createRepositoryWithCookie(args)
    )
  }

  private async createRepositoryWithCookie({
    domain,
    // app, TODO: add app
    customTypes,
    signedDocuments,
  }: CreateRepositoryArgs): Promise<AxiosResponse> {
    const signature = signedDocuments?.signature
    const documents = signedDocuments?.documents ? JSON.stringify(signedDocuments.documents) : undefined
    const data = {
      domain,
      plan: 'personal',
      isAnnual: 'false',
      ...(customTypes?.length ? {'custom-types': JSON.stringify(customTypes)} : {}),
      signature,
      documents,
    }

    const retry = () => this.createRepositoryWithCookie({domain, customTypes, signedDocuments})

    // const querystring = {app: 'slicemachine'}
    return this.axios().post('/authentication/newrepository', data).catch(error => {
      if (error.response.status === 401) {
        return this.reAuthenticate().then(retry)
      }
      throw error
    })
  }

  private async createRepositoryWithToken({
    domain,
    // app,
    customTypes,
    signedDocuments,
  }: CreateRepositoryArgs): Promise<AxiosResponse> {
    const signature = signedDocuments?.signature
    const documents = signedDocuments?.documents ? JSON.stringify(signedDocuments.documents) : undefined
    const data = {
      access_token: this.oauthAccessToken,
      domain,
      plan: 'personal',
      isAnnual: 'false',
      ...(customTypes?.length ? {'custom-types': JSON.stringify(customTypes)} : {}),
      signature,
      documents,
    }
    const url = new URL(this.base)
    url.hostname = `api.${url.hostname}`
    url.pathname = '/management/repositories'

    const retry = () => this.createRepositoryWithToken({domain, customTypes, signedDocuments})

    const address = url.toString()
    return this.axios().post(address, data).catch(error => {
      if (error.response.status === 401) {
        return this.reAuthenticate().then(retry)
      }
      throw error
    })
  }
}
