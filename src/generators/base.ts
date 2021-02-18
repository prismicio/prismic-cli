// see https://github.com/oclif/oclif/blob/master/src/generators/app.ts
import {ReadStream} from 'fs'
import * as Generator from 'yeoman-generator'
import axios from 'axios'
import * as tmp from 'tmp-promise'
import * as AdmZip from 'adm-zip'
import * as path from 'path'
import cli from 'cli-ux'
import {fs} from '../utils'
import Prismic, {CustomType, CustomTypeMetaData} from '../prismic/base-class'

export interface TemplateOptions extends Generator.GeneratorOptions {
  branch: string;
  source: string;
  innerFolder: string;
}

export default abstract class PrismicGenerator extends Generator {
  domain: string;

  force: boolean;

  path: string;

  prismic: Prismic;

  constructor(args: string | string[], opts: TemplateOptions) {
    super(args, opts)
    this.path = opts.path
    this.force = opts.force
    this.domain = opts.domain
    this.prismic = opts.prismic
  }

  async downloadAndExtractZipFrom(source: string, innerFolder?: string): Promise<this> {
    const tmpFile = await tmp.file()
    const tmpDir = await tmp.dir()

    const progressBar = cli.progress({
      format: 'Downloading Template | {bar} {percentage}% | ETA {eta}s',
    })
    return axios.get<ReadStream>(source, {
      responseType: 'stream',
    })
    .then(res => {
      const total = res.headers['content-length'] // TODO: this may not exist :/
      let count = 0

      progressBar.start(total, count)
      return new Promise<tmp.FileResult>((resolve, reject) => {
        const writeStream = fs.createWriteStream(tmpFile.path)

        res.data.on('data', chunk => {
          count += chunk.length
          progressBar.update(count)
        })

        res.data.pipe(writeStream)
        .on('finish', () => {
          progressBar.stop()
          return resolve(tmpFile)
        })

        .on('error', error => {
          progressBar.stop()
          return reject(error)
        })
      })
    }).then(() => {
      cli.action.start('Extracting Zip to mem-fs')
      const zip = new AdmZip(tmpFile.path)
      zip.extractAllTo(tmpDir.path)
      return tmpFile.cleanup()
    }).then(() => {
      const location = innerFolder ? path.join(tmpDir.path, innerFolder) : tmpDir.path
      this.fs.copy(location, this.path)
      cli.action.stop()
      return this
    })
  }

  readCustomTypesFrom(customTypesDirectory = 'custom_types'): Array<CustomType> {
    const pathToCustomTypesMetaInfo = this.destinationPath(customTypesDirectory, 'index.json')

    const customTypesMetaInfoAsString: string = this.fs.read(pathToCustomTypesMetaInfo, {defaults: '[]'})

    const customTypesMetaInfo: Array<CustomTypeMetaData> = JSON.parse(customTypesMetaInfoAsString)

    const customTypes: Array<CustomType> = customTypesMetaInfo.map((ct: CustomTypeMetaData) => {
      const location = this.destinationPath('custom_types', ct.value)
      const value = this.fs.readJSON(location)
      return {...ct, value}
    })

    return customTypes
  }

  readDocumentsFrom(documentsDirectory = 'documents'): Documents | undefined {
    const pathToDocuments = this.destinationPath(documentsDirectory)
    const pathToSignatureFile = path.join(pathToDocuments, 'index.json')

    if (this.fs.exists(pathToSignatureFile) === false) {
      return
    }

    const documents: Document = {}

    this.env.sharedFs.each(file => {
      if (file.isNew && file.relative.includes(pathToDocuments) && file.relative !== pathToSignatureFile) {
        const name: string = file.stem
        const value = this.fs.readJSON(file.relative)
        documents[name] = value
      }
    })

    const signatureFile = this.fs.read(path.join(pathToDocuments, 'index.json'))
    const {signature} = JSON.parse(signatureFile)

    return {
      signature,
      documents,
    }
  }

  private branchFromUrl(source: string) {
    const lastSlash = source.lastIndexOf('/')
    const fileExtension = source.lastIndexOf('.')
    return source.substring(lastSlash + 1, fileExtension)
  }

  private gitRepoFromUrl(source: string) {
    const url = new URL(source)
    const paths = url.pathname.split('/').filter(_ => _)
    return paths[1]
  }

  innerFolderFromGitRepo(source: string) {
    const branch = this.branchFromUrl(source)
    const repo = this.gitRepoFromUrl(source)
    return `${repo}-${branch}`
  }
}

export interface Document {
  [key: string]: any;
}

export interface Documents {
  signature: string;
  documents: Document;
}

export interface SliceMachineJson {
  apiEndpoint: string;
  libraries: Array<string>;
  _latest: string;
  storybook?: string;
}
