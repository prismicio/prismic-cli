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

const version: string = require('../../package.json').version

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

export function toAuthUrl(path: 'validate' | 'refreshtoken', token: string, base = 'https://prismic.io') {
  const url = new URL(base)
  url.hostname = `auth.${url.hostname}`
  url.pathname = path
  url.searchParams.set('token', token)
  return url.toString()
}

/**
 * Handles communcation logic between the cli and prismic.io, should be treated as a singleton.
 * @class
 */
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

    this.validateRepositoryName = this.validateRepositoryName.bind(this)
  }

  private getConfig(): LocalDB {
    return getOrCreateConfig(this.configPath)
  }

  private async removeConfig(): Promise<void> {
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

  /**
   * A custom instance of axios for communicating with prismic.io
   * @param {AxiosInstanceOptions} [options] - options passed to axios.create()
   * @returns {AxiosInstance} - axios instance.
   */
  axios(options?: AxiosInstanceOptions): AxiosInstance {
    const headers = {
      'User-Agent': `prismic-cli/${version}`,
      Cookie: this.cookies || this.getConfig().cookies,
      ...options?.headers,
    }
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

  /**
   * Handles login logic using email and password or an oauth access token
   * @param {Object} data - Login data
   * @param {String} [data.base = https://prismic.io] - where to login
   * @param {String} [data.email] - users email address
   * @param {String} [data.password] - users password
   * @param {String} [data.oauthaccesstoken] - for logingin in with SSO
   * @returns {Promise} - will either resolve or reject
   */
  public async login(data: LoginData): Promise<void> {
    const {base, email, password, oauthaccesstoken} = data
    const params = oauthaccesstoken ? {oauthaccesstoken} : {email, password}
    if (base) {
      this.base = base
    }

    return this.axios().post('/authentication/signin', qs.stringify(params), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    })
    .then((res: AxiosResponse) => {
      return this.setCookies(res.headers['set-cookie'])
    })
  }

  private async auth(path: 'validate' | 'refreshtoken'): Promise<AxiosResponse> {
    const token = cookie.parse(this.cookies)['prismic-auth'] || ''
    const url = toAuthUrl(path, token, this.base)
    return this.axios().get(url)
  }

  /**
   * creates a new prismic account
   * @param {String} email - the email address to associate with the account
   * @param {String} password - the password for the account
   * @param {String} [base = https://prismic.io] - where to make the account
   * @returns
   */

  async signUp(email: string, password: string, base?: string): Promise<AxiosResponse> {
    if (base) {
      this.base = base
    }
    return this.axios().post('/authentication/signup', undefined, {
      params: {
        ml: true, // TODO: what's this for?
        email,
        password,
      },
    }).then((res: AxiosResponse) => {
      this.setCookies(res.headers['set-cookie'])
      return res
    }).catch(error => {
      throw error
    })
  }

  async validateSession(): Promise<AxiosResponse> {
    return this.auth('validate')
  }

  async refreshSession(): Promise<void> {
    return this.auth('refreshtoken').then(res => {
      const token = cookie.serialize('prismic-auth', res.data)
      return this.setCookies([token])
    })
  }

  async validateAndRefresh(): Promise<void> {
    // TDOD: does this handle oauthAccessTokens?
    return this.validateSession().then(() => this.refreshSession())
  }

  /**
   * Checks if the user is authenticated
   * @returns {Promise} - resolves if the user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    // TODO: find out if / how the authh server handles oauth tokens
    // if (this.oauthAccessToken) return Promise.resolve(true)

    if (!this.cookies) return Promise.resolve(false)
    const cookies = cookie.parse(this.cookies)
    if (!cookies.SESSION) return Promise.resolve(false)
    if (!cookies['prismic-auth']) return Promise.resolve(false)

    return this.validateAndRefresh()
    .then(() => true)
    .catch(error => {
      const status = error?.response?.status || 100
      if (Math.floor(status / 100) === 4) {
        return false
      }
      throw error
    })
  }

  /**
   * Promtps the user to reauthenticate
   * @returns {Promise} - resolves if successful
   */

  public async reAuthenticate(): Promise<void> {
    // TODO: this will eventually have to be moved.
    const email =  await cli.prompt('Email')
    const password =  await cli.prompt('Password', {type: 'hide'})
    return this.login({email, password}).catch(error => {
      if (error?.response?.status === 401) {
        return this.reAuthenticate()
      }
      throw error
    })
  }

  /**
   * Validates a repository name and checks availability
   * @param name - repository name
   * @returns {Promise} - rejects with errors if any, else resolves with the repository name
   */

  public async validateRepositoryName(name?: string): Promise<string> {
    if (!name) return Promise.reject(new Error('repository name is required'))

    const domain = name.toLocaleLowerCase().trim()

    const errors = []

    const startsWithLetter = /^[a-z]/.test(domain)
    if (!startsWithLetter) errors.push('Must start with a letter.')

    const acceptedChars = /^[a-z0-9-]+$/.test(domain)
    if (!acceptedChars) errors.push('Must contain only letters, numbers and hyphens.')

    const fourCharactersOrMore = domain.length >= 4
    if (!fourCharactersOrMore) errors.push('Must have four or more alphanumeric characters and/or hyphens.')

    const endsWithALetterOrNumber = /[a-z0-9]$/.test(domain)
    if (!endsWithALetterOrNumber) errors.push('Must end in a letter or a number.')

    const thirtyCharacterOrLess = domain.length <= 30
    if (!thirtyCharacterOrLess) errors.push('Must be 30 characters or less')

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

  /**
   * creates a prismic repository
   * @param args
   * @returns {Promise<AxiosResponse<string>>} - AxiosResponse containing the repository name
   */

  public async createRepository(args: CreateRepositoryArgs): Promise<AxiosResponse<string>> {
    /*
    const hasAuth = await this.isAuthenticated()

    if (!hasAuth) {
      await this.reAuthenticate()
    }
    */

    return (
      this.oauthAccessToken ? this.createRepositoryWithToken(args) : this.createRepositoryWithCookie(args)
    )
  }

  private async createRepositoryWithCookie({
    domain,
    // app, TODO: add app
    customTypes,
    signedDocuments,
  }: CreateRepositoryArgs): Promise<AxiosResponse<string>> {
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

    const url = new URL(this.base)
    url.pathname = '/authentication/newrepository'
    url.searchParams.append('app', 'slicemachine')

    // const querystring = {app: 'slicemachine'}
    cli.action.start('creating prismic repository')
    return this.axios({maxRedirects: 0}).post<string>(url.toString(), data)
    .then(res => {
      cli.action.stop()
      return res
    })
    .catch(error => {
      cli.action.stop()
      const status: number = Math.floor((error?.response?.status || 100) / 100)
      if (status === 4 || status === 3) {
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
  }: CreateRepositoryArgs): Promise<AxiosResponse<string>> {
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
    url.searchParams.append('app', 'slicemachine')

    const retry = () => this.createRepositoryWithToken({domain, customTypes, signedDocuments})

    const address = url.toString()
    cli.action.start('creating prismic repository')
    return this.axios().post<ObjectWithDomain>(address, data)
    .then(res => {
      cli.action.stop()
      return {...res, data: res.data.domain}
    })
    .catch(error => {
      cli.action.stop()
      const status: number = Math.floor((error?.response?.status || 100) / 100)
      if (status === 4 || status === 3) {
        return this.reAuthenticate().then(retry)
      }
      throw error
    })
  }
}

interface ObjectWithDomain {
  domain: string;
}
