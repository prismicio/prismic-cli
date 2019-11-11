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

export const CustomType = {
  async read(directory: string): Promise<any[] | undefined> {
    const dir = join(directory, 'custom_types')
    const path = join(dir, 'index.json')
    if (existsSync(path)) {
      const types = JSON.parse(await readFile(path, 'utf-8')) as any[]
      return types.map(t => {
        const valuePath = join(dir, t.value)
        return { ...t, value: JSON.parse(fs.readFileSync(valuePath, 'utf-8')) }
      })
    }
  }
}
