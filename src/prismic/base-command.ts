import {Command} from '@oclif/command'
import {IConfig} from '@oclif/config'
import Prismic from './base-class'
import * as path from 'path'
import * as fs from 'fs'
import cli from 'cli-ux'

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
    return this.prismic.validateRepositoryName(name)
    .catch(error => {
      this.log(error.message)
      return cli.prompt('prismic subdomain', {required: true}).then(this.validateDomain.bind(this))
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
}
