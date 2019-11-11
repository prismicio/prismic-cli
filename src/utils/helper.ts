import * as fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'

import Config from './config'
const existsSync = fs.existsSync
// TODO: Change this to promises.readFile for node >= 12
const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)

// Domain
export const Domain = {
  repository(repository: string, base: string = Config.defaults.baseURL()) {
    const matches = base.match(new RegExp('((https?://)([^/]*))'))
    if (!matches) return ''

    return `${matches[2]}${repository}.${matches[3]}`
  },
  api(base: string, domain: string) {
    return `${this.repository(base, domain)}/api`
  },
}
