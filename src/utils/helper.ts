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

export const Document = {
  parseName(filename: string) {
    const matches = filename.match(/(.+)\.json/)
    if (matches) {
      return matches[1]
    }
    return ''
  },
  async read(directory: string) {
    const dir = join(directory, 'documents')
    const path = join(dir, 'index.json')
    if (existsSync(path)) {
      const { signature } = JSON.parse(await readFile(path, 'utf-8'))

      if (!signature) {
        throw new Error('Missing signature in your prismic documents dump')
      }

      const langIds = (await readdir(dir)).filter(p => !p.match('index.js'))

      const docs = langIds.reduce((langAccount, langId) => {
        const langPath = join(dir, langId)
        const filenames = (fs.readdirSync(langPath))
        const language = filenames.reduce((account, filename) => {
          const key = this.parseName(filename)
          const value = JSON.parse(join(langPath, filename))
          return { ...account, ...{ [key]: value } }
        }, {})

        return { ...langAccount, ...language }
      }, {})

      return { signature, docs }
    }
  }
}
