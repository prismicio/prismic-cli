import * as fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

export const PRISMIC_CLI_CONFIG_PATH = join(
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) as string,
  '.prismic'
)

export const PRISMIC_CLI_DEFAULT_BASE_URL = 'https://www.prismic.io'
export const PRISMIC_CLI_DEFAULT_CONFIG_FILE = join(__dirname, '..', 'prismic.config.js')

async function read() {
  try {
    const file = await stat(PRISMIC_CLI_CONFIG_PATH)
    if (file) {
      return await readFile(PRISMIC_CLI_CONFIG_PATH, 'utf8') as string
    }
  } catch (_) { }

  return '{}'
}

async function write(data: any) {
  await writeFile(PRISMIC_CLI_DEFAULT_CONFIG_FILE, data, 'utf8')
}

const Config = {
  defaults: {
    baseURL() {
      return PRISMIC_CLI_DEFAULT_BASE_URL
    },
    configFilePath() {
      return PRISMIC_CLI_DEFAULT_CONFIG_FILE
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
