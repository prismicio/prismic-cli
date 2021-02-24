import {Command} from '@oclif/command'
import {IConfig} from '@oclif/config'
import Prismic from './communication'
import * as path from 'path'
import {fs} from '../utils'
import cli from 'cli-ux'
import {posix} from 'path'
import axios, {AxiosError} from 'axios'
import * as inquirer from 'inquirer'

import chalk from 'chalk'

export default abstract class PrismicCommand extends Command {
  prismic: Prismic;

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.prismic = new Prismic(config)
  }

  async catch(err: any): Promise<any> {
    // TODO: add sentry here
    super.catch(err)
  }

  async validateDomain(name: string | undefined): Promise<string> {
    const base = new URL(this.prismic.base)

    return this.prismic.validateRepositoryName(name)
    .catch(error => {
      console.error(error)
      return inquirer.prompt([{
        type: 'input',
        name: 'domain',
        message: 'Name your prismic repository: ',
        required: true,
        default: name,
        transformer(value) {
          const reponame = value ? chalk.cyan(value) : chalk.dim.cyan('repo-name')
          const msg = [
            chalk.dim(`${base.protocol}//`),
            reponame,
            chalk.dim(`.${base.hostname}`),
          ]
          return msg.join('')
        },
      }]).then(res => res.domain).then(this.validateDomain.bind(this))
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
