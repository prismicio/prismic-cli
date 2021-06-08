import {Command} from '@oclif/command'
import {IConfig} from '@oclif/config'
import Prismic from './communication'
import * as path from 'path'
import {fs} from '../utils'
import cli from 'cli-ux'
import {posix} from 'path'
import axios, {AxiosError} from 'axios'
import * as inquirer from 'inquirer'
import datadog from '../utils/data-dog'

import * as chalk from 'chalk'

export default abstract class PrismicCommand extends Command {
  prismic: Prismic;

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.prismic = new Prismic(config, this.debug)
    this.login = this.login.bind(this)
  }

  async catch(err: any): Promise<any> {
    await datadog(err, this).catch(() => this.warn('Failed to send error to datadog'))
    return super.catch(err)
  }

  async login(): Promise<void> {
    // used when sa session in fails
    if (this.prismic.base !== 'https://prismic.io') {
      this.warn(`current base is set to ${this.prismic.base}`)
    }
    const email =  await cli.prompt('Email')
    const password =  await cli.prompt('Password', {type: 'hide'})
    return this.prismic.login({email, password})
    .then(() => this.log(`Successfully logged in to ${this.prismic.base}`))
    .catch((error: AxiosError) => {
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        this.log(`Login error, check your credentials. If you forgot your password, visit ${this.prismic.base} to reset it`)
        return this.login()
      }
      throw error
    })
  }

  async validateDomain(name: string | undefined): Promise<string> {
    const base = new URL(this.prismic.base)
    const validate = this.prismic.validateRepositoryName
    const isValid = (name) ? validate(name) : Promise.reject(new Error(''))

    return isValid.catch(_ => {
      if (_.message) this.warn(_.message)

      return inquirer.prompt([{
        type: 'input',
        name: 'domain',
        message: 'Name your prismic repository: ',
        required: true,
        transformer(value) {
          const reponame = value ? chalk.cyan(value) : chalk.dim.cyan('repo-name')
          const msg = [
            chalk.dim(`${base.protocol}//`),
            reponame,
            chalk.dim(`.${base.hostname}`),
          ]
          return msg.join('')
        },
        async validate(name) {
          const result = await validate(name)
          return result === name || result
        },
      }]).then(res => res.domain).then(validate) // TODO: Find out a way to inquerer prompts in isolation.
    })
  }

  async validateFolder(name: string | undefined, fallback: string, force: boolean): Promise<string> {
    const folder: string = name || await cli.prompt('project folder', {default: fallback})

    if (fs.existsSync(folder) && !force) {
      this.warn(`Folder: ${folder} exists. use --force to overwrite`)
      return this.exit()
    }
    return Promise.resolve(folder)
  }

  async validateTheme(maybeTheme?: string): Promise<string> {
    const theme: string = maybeTheme || await cli.prompt('Theme url').then(this.validateTheme.bind(this))

    if (this.isLocalZip(theme)) return theme
    if (this.isAbsoluteUrlToZip(theme)) return theme

    return this.maybeGitHubRepo(theme)
  }

  isLocalZip(maybePath: string): boolean {
    const {ext} = path.parse(maybePath)
    if (fs.existsSync(maybePath) && ext === '.zip') {
      return true
    }
    return false
  }

  isAbsoluteUrlToZip(maybeUrl: string): boolean {
    try {
      const url = new URL(maybeUrl)
      const {ext} = path.parse(url.pathname)
      return (ext === '.zip')
    } catch {
      return false
    }
  }

  isGithubUrl(maybeUrl: string): boolean {
    try {
      const url = new URL(maybeUrl)
      return url.hostname.includes('github')
    } catch {
      return false
    }
  }

  async maybeGitHubRepo(source: string): Promise<string> {
    if (this.isAbsoluteUrlToZip(source)) return source
    if (this.isGithubUrl(source) === false) return Promise.reject(new Error(`Could not guess where to find zip from ${source}`))
    const url = new URL(source)

    const maybeRepoAndBranch = /(\/.*\/.*\/)tree\/(.*)/.exec(url.pathname)
    if (maybeRepoAndBranch) {
      const [, repo, branch] = maybeRepoAndBranch
      url.pathname = posix.join(repo, 'archive', `${branch}.zip`)
      return url.toString()
    }

    const maybeRepo = /(\/.*\/.*)/.exec(url.pathname)
    if (!maybeRepo) {
      const error = new Error(`Could not infer github repo from ${source}`)
      return Promise.reject(error)
    }

    const [, repo] = maybeRepo

    const master = new URL(source)
    master.pathname = posix.join(repo, 'archive', 'master.zip')

    const main = new URL(source)
    main.pathname = posix.join(repo, 'archive', 'main.zip')

    const masterUrl = master.toString()
    const mainUrl = main.toString()

    return axios.head(mainUrl)
    .then(() => mainUrl)
    .catch(async () => {
      return axios.head(masterUrl)
      .then(() => masterUrl)
      .catch((error: AxiosError) => {
        if (error.response?.status === 404) {
          const err = new Error(`Could not resolve ${main} or ${master}`)
          return Promise.reject(err)
        }
        return Promise.reject(error)
      })
    })
  }
}
