import { promises as fs } from 'fs'
import { join } from 'path'

const stat = fs.stat
const readFile = fs.readFile
const writeFile = fs.writeFile

export const PRISMIC_CLI_DEFAULT_BASE_URL = 'https://prismic.io'
export const PRISMIC_CLI_DEFAULT_CONFIG_FILE = join(__dirname, '..', 'prismic.config.js')

export async function read() {
  try {
    const file = await stat(Config.defaults.configFilePath())
    if (file) {
      return await readFile(Config.defaults.configFilePath(), 'utf8') as string
    }
  } catch (_) { }

  return '{}'
}

export async function write(data: any) {
  return writeFile(Config.defaults.configFilePath(), data)
}

const Config = {
  defaults: {
    baseURL() {
      return PRISMIC_CLI_DEFAULT_BASE_URL
    },
    configFilePath() {
      return join(
        (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) as string,
        '.prismic'
      )
    }
  },
  async all() {
    const json = await read()
    try {
      return JSON.parse(json)
    } catch (_) {
      return {}
    }
  },
  async get(key: string) {
    return (await this.all())[key]
  },
  async set(value: any = {}) {
    let json = await this.all()
    json = JSON.stringify({ ...json, ...value }, null, 4)
    return write(json)
  }
}

export default Config
