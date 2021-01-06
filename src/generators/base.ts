/* base functions used by the generators here */

// see https://github.com/oclif/oclif/blob/master/src/generators/app.ts

import * as Generator from 'yeoman-generator'
import axios from 'axios'
import * as tmp from 'tmp-promise'
import * as AdmZip from 'adm-zip'
import * as path from 'path'
import cli from 'cli-ux'
import {fs} from '../utils'

import Prismic, {CustomType, CustomTypeMetaData} from '../prismic/base-class'

import {ReadStream} from 'fs'
import {AxiosResponse} from 'axios'


export interface TemplateOptions extends Generator.GeneratorOptions {
  branch: string;
  source: string;
  innerFolder: string;
}

/*
export function optionsFromGitUrl(url: string): TemplateOptions {...} 
*/

// a generator maybe un-needed for this part.
export default abstract class PrismicGenerator extends Generator {
  // idea have these as statically accessible properties.

  domain: string;

  branch: string;

  force: boolean;

  path: string;

  source: string;

  innerFolder: string;

  prismicConfig: string;

  prismic: Prismic;

  constructor(args: string | string[], opts: TemplateOptions) {
    super(args, opts)
    this.path = opts.path
    this.force = opts.force
    this.innerFolder = opts.innerFolder
    this.source = opts.source
    this.prismicConfig = opts.prismicConfig
    this.domain = opts.domain
    this.prismic = opts.prismic
    this.branch = opts.branch || 'master'
  }

  async writing() {
    // Note to self methods on the parent generator will not be called automatically, so this can be refactored... alot :)
    const tmpFile = await tmp.file()
    const tmpDir = await tmp.dir()

    const simpleBar = cli.progress({
      format: 'Downloading Template | {bar} {percentage}% | ETA {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    })
    return axios.get<ReadStream>(this.source, {
      responseType: 'stream',
    })
    .then(res => {
      return new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(tmpFile.path)
        const total = res.headers['content-length']
        let count = 0

        simpleBar.start(total, count)

        res.data.on('data', chunk => {
          count += chunk.length
          simpleBar.update(count)
        })

        res.data.pipe(writeStream)
        .on('finish', () => {
          simpleBar.stop()
          return resolve()
        })

        .on('error', error => {
          simpleBar.stop()
          return reject(error)
        })
      })
    })
    .then(() => {
      const zip = new AdmZip(tmpFile.path)
      zip.extractAllTo(tmpDir.path, this.force)
      return tmpFile.cleanup()
    }).then(() => {
      const location = path.join(tmpDir.path, this.innerFolder)
      this.fs.copy(location, this.path)
      // return tmpDir.cleanup()
    })
    .then(() => {
      cli.action.start('Creating repository')
      // read custom types first
      const location = path.join(this.path, 'custom_types', 'index.json')

      const customTypesMapAsString: string = this.fs.read(location, {defaults: '[]'})
      
      const customTypesMetaInfo: Array<CustomTypeMetaData> = JSON.parse(customTypesMapAsString)
 
      const customTypes = customTypesMetaInfo.map((ct: CustomTypeMetaData) => {
        const location = path.join(this.path, 'custom_types', ct.value)
        const value = this.fs.readJSON(location)
        return {...ct, value} as CustomType
      })

      // TODO: add documents

      return customTypes
    }).then((customTypes: Array<CustomType>) => {
      return this.prismic.createRepository({domain: this.domain, customTypes})
    }).then(() => {
      // TODO: check the respose from creating a repostiory
      cli.action.stop()
      const location = path.join(this.path, this.prismicConfig)
      const oldConfig = this.fs.read(location)
      // TODO: make this more reliable.
      const config = oldConfig.replace(/your-repo-name/g, this.domain)
      return this.fs.write(location, config)
    })
  }
}
