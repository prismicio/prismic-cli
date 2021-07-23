import {fs} from '../utils'
import * as path from 'path'
import * as cookie from '../utils/cookie'
import Axios, {AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosError} from 'axios'
import * as os from 'os'
import {IConfig} from '@oclif/config'
import {parseJsonSync} from '../utils'
import cli from 'cli-ux'
// Note to self it's easier to mock fs sync methods.

import {startServerAndOpenBrowser, DEFAULT_PORT} from '../utils/server'
import {LogDecorations, PRISMIC_LOG_HEADER} from '../utils/logDecoration'

const version: string = require('../../package.json').version

export interface LocalDB {
  base: string;
  cookies: string;
  oauthAccessToken?: string;
}

export type Apps = 'slicemachine' | '' | null | undefined

interface CustomTypeBase {
  id: string;
  name: string;
  repeatable: string;
}
export interface CustomTypeMetaData extends CustomTypeBase {
  value: string;
}

export interface CustomType extends CustomTypeBase {
  value: object;
}

export interface SliceMachineCustomType extends CustomTypeBase {
  json: object;
}

export interface CreateRepositoryArgs {
  domain: string;
  framework: string;
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

const noop = () => null

export default class Prismic {
  public configPath: string;

  public base: string;

  public cookies: string;

  public oauthAccessToken: string | undefined;

  public authUrl: string | undefined

  public debug: (...args: any[]) => void;

  constructor(config?: IConfig, debug?: (...args: any[]) => void) {
    const home = config && config.home ? config.home : os.homedir()
    this.configPath = path.join(home, '.prismic')
    const {base, cookies, oauthAccessToken} = getOrCreateConfig(this.configPath)
    this.base = base
    this.cookies = cookies
    this.oauthAccessToken = oauthAccessToken
    this.validateRepositoryName = this.validateRepositoryName.bind(this)

    this.setCookies = this.setCookies.bind(this)

    this.debug = debug || noop
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

  public async setCookies(arr: Array<string> = []): Promise<void> {
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

  private async startServerAndOpenBrowser(url: string, base: string, port: number, logAction: string): Promise<void> {
    // tbh setCookies could be another callback if you wanted.
    return startServerAndOpenBrowser(url, base, port, logAction, this.setCookies)
  }

  /**
   * login in to a prismic account
   * @param {Number} [port = 5555] - the port to listen on
   * @param {String} [base = https://prismic.io] - where to make the account
   * @param {String} [maybeAuthUrl = https://auth.prismic.io] - address to call for validating and refreshing tokens
   * @returns
   */
  public async login(maybePort: number = DEFAULT_PORT, maybeBase?: string, maybeAuthUrl?: string): Promise<void> {
    if (maybeBase) this.base = maybeBase
    if (maybeAuthUrl) this.authUrl = maybeAuthUrl // TODO: will be added upstream
    const base = maybeBase || this.base

    const loginUrl = new URL(this.base)
    loginUrl.pathname = 'dashboard/cli/login'
    loginUrl.searchParams.append('port', maybePort.toString())
    const logAction = PRISMIC_LOG_HEADER + 'Logging in'

    return this.startServerAndOpenBrowser(loginUrl.toString(), base, maybePort, logAction)
  }

  private async auth(path: 'validate' | 'refreshtoken'): Promise<AxiosResponse> {
    const token = cookie.parse(this.cookies)['prismic-auth'] || ''
    const url = toAuthUrl(path, token, this.base)
    return this.axios().get(url)
  }

  /**
   * creates a new prismic account
   * @param {Number} [port = 5555] - the port to listen on
   * @param {String} [base = https://prismic.io] - where to make the account
   * @param {String} [maybeAuthUrl = https://auth.prismic.io] - address to call for validating and refreshing tokens
   * @returns
   */
  async signUp(maybePort: number = DEFAULT_PORT, maybeBase?: string, maybeAuthUrl?: string): Promise<void> {
    if (maybeBase) this.base = maybeBase
    if (maybeAuthUrl) this.authUrl = maybeBase
    const base = maybeBase || this.base
    const signUpUrl = new URL(this.base)
    signUpUrl.pathname = 'dashboard/cli/signup'
    signUpUrl.searchParams.append('port', maybePort.toString())

    const logAction: string = PRISMIC_LOG_HEADER + 'Signing in'

    return this.startServerAndOpenBrowser(signUpUrl.toString(), base, maybePort, logAction)
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
    .catch((error: AxiosError) => {
      this.debug('communication.isAuthenticated', error.message)
      const status = error?.response?.status || 100
      if (Math.floor(status / 100) === 4) {
        return false
      }
      if (error.response) {
        this.debug(`[${error.response?.status}]: ${error.response?.statusText}`)
        this.debug(error.response.data)
      }
      throw error
    })
  }

  /**
   * Promtps the user to reauthenticate
   * @returns {Promise} - resolves if successful
   */

  public async reAuthenticate(retries = 0): Promise<void> {
    if (retries === 0) {
      const confirmationMessage = PRISMIC_LOG_HEADER + 'Press any key to open up the browser to login or ' + LogDecorations.FgRed + 'q' + LogDecorations.Reset + ' to exit'

      const confirmationKey: string = await cli.prompt(confirmationMessage, {type: 'single', required: false})

      if (confirmationKey === 'q' || confirmationKey === '\u0003') return process.exit() // eslint-disable-line no-process-exit, unicorn/no-process-exit
    }

    return this.login().catch((error: AxiosError) => {
      if (error?.response?.status === 401) {
        return this.reAuthenticate(retries + 1)
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
    this.debug('createRepository', JSON.stringify(args))
    const p = this.oauthAccessToken ? this.createRepositoryWithToken(args) : this.createRepositoryWithCookie(args)
    return p.then(res => {
      this.debug('createRepository:', res.status, res.statusText)
      return res
    }).catch((error: AxiosError) => {
      this.debug('ERROR: createRepository', error.message, error.response?.status, error.response?.statusText)
      throw error
    })
  }

  private async createRepositoryWithCookie({
    domain,
    // app, TODO: add app
    customTypes,
    signedDocuments,
    framework,
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
      role: 'developer',
      framework,
    }

    const retry = () => this.createRepositoryWithCookie({domain, framework, customTypes, signedDocuments})

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
        if (error.response.data) console.error(error.response.data)
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
    framework,
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
      role: 'developer',
      framework,
    }
    const url = new URL(this.base)
    url.hostname = `api.${url.hostname}`
    url.pathname = '/management/repositories'
    url.searchParams.append('app', 'slicemachine')

    const retry = () => this.createRepositoryWithToken({domain, framework, customTypes, signedDocuments})

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
