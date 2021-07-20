// see https://github.com/oclif/oclif/blob/master/src/generators/app.ts
import * as Generator from 'yeoman-generator'
import axios from 'axios'
import * as tmp from 'tmp-promise'
import * as AdmZip from 'adm-zip'
import * as npath from 'path'
import cli from 'cli-ux'
import * as fs from 'fs'
import {lookpath} from 'lookpath'
import * as ejs from 'ejs'
import {camelCase} from 'lodash'

const {snakelize} = require('sm-commons/utils/str')

const path = npath.posix

import type Prismic from 'prismic-cli/src/prismic/communication'
import type {CustomType, CustomTypeMetaData, SliceMachineCustomType} from 'prismic-cli/src/prismic/communication'

function pascalCaseToSnakeCase(str: string): string {
  return snakelize(str)
}

function toDescription(str: string) {
  return str.split(/(?=[A-Z0-9])/).join(' ')
}

function createStorybookId(str: string): string {
  const camel = camelCase(str)
  return `_${camel[0].toUpperCase()}${camel.slice(1)}`
}
export interface TemplateOptions extends Generator.GeneratorOptions {
  // branch: string;
  // source: string;
  // innerFolder: string;
  force: boolean;
  path: string;
  prismic: Prismic;
  domain: string;
  pm?: 'yarn' | 'npm' | undefined;
}

export interface PkgJson  {
  dependencies?: Record<string, string>;
}

export default abstract class PrismicGenerator extends Generator {
  domain: string;

  force: boolean;

  path: string;

  prismic: Prismic;

  pm: 'yarn' | 'npm' | undefined;

  constructor(args: string | string[], opts: TemplateOptions) {
    super(args, opts)
    this.path = opts.path
    this.force = opts.force
    this.domain = opts.domain
    this.prismic = opts.prismic
    this.pm = opts.pm
  }

  /**
   * Will infer to use yarn or npm and prompt the user to select a package manager when in doubt.
   * The result is assigned "this.pm" and return ed.
   * @example
   * ```ts
   * if(!this.pm) await this.promptForPackageManager()
   * ```
   *
   */
  async promptForPackageManager(): Promise<'yarn'|'npm'> {
    const hasYarn = await lookpath('yarn')
    const usesYarn = fs.existsSync(this.destinationPath('yarn.lock'))
    if (!hasYarn) {
      this.pm = 'npm'
      return this.pm
    }
    if (usesYarn) {
      this.pm = 'yarn'
      return this.pm
    }
    return this.prompt({
      type: 'list',
      name: 'pm',
      message: 'package manager',
      choices: ['yarn', 'npm'],
    }).then(res => {
      this.pm = res.pm
      return res.pm
    })
  }

  /**
   * Downloads a zip file and extracts it to yeoman's mem-fs.
   * Mainly use in the theme command/generator
   *
   * @param {string} source - the full url to a zip file with a template repo
   * @param {?string} innerFolder - the folder to extract from the downloaded zip file
   *
   * @example
   * ```ts
   * this.downloadAndExtractZipFrom('https://github.com/prismicio/fake-theme/archive/master.zip, 'fake-theme-master')
   * ```
   */
  async downloadAndExtractZipFrom(source: string, innerFolder?: string): Promise<this> {
    const tmpFile = await tmp.file()
    const tmpDir = await tmp.dir()

    const progressBar = cli.progress({
      format: 'Downloading Template | {bar} {percentage}% | ETA {eta}s',
    })
    return axios.get<fs.ReadStream>(source, {
      responseType: 'stream',
    })
    .then(res => {
      const total = res.headers['content-length']
      let count = 0

      const startProgress = () => total ? progressBar.start(total, count) : cli.action.start('Downloading starter project')
      const updateProgress = (count: number) => total ? progressBar.update(count) : undefined
      const stopProgress = () => total ? progressBar.stop() : cli.action.stop('Download complete')

      startProgress()

      return new Promise<tmp.FileResult>((resolve, reject) => {
        const writeStream = fs.createWriteStream(tmpFile.path)

        res.data.on('data', chunk => {
          count += chunk.length
          updateProgress(count)
        })

        res.data.pipe(writeStream)
        .on('finish', () => {
          stopProgress()
          return resolve(tmpFile)
        })

        .on('error', error => {
          stopProgress()
          return reject(error)
        })
      })
    }).then(() => {
      const zip = new AdmZip(tmpFile.path)
      zip.extractAllTo(tmpDir.path)
      return tmpFile.cleanup()
    }).then(() => {
      const location = innerFolder ? path.join(tmpDir.path, innerFolder) : tmpDir.path
      this.fs.copy(location, this.destinationPath(), {globOptions: {dot: true}})
      return this
    })
  }

  private handleOldCustomTypes(customTypesDirectory: string): Array<CustomType> {
    const pathToCustomTypesMetaInfo = this.destinationPath(customTypesDirectory, 'index.json')

    const customTypesMetaInfoAsString: string = this.fs.read(pathToCustomTypesMetaInfo, {defaults: '[]'})

    const customTypesMetaInfo: Array<CustomTypeMetaData> = JSON.parse(customTypesMetaInfoAsString)

    const customTypes: Array<CustomType> = customTypesMetaInfo.map((meta: CustomTypeMetaData) => {
      const location = this.destinationPath(customTypesDirectory, meta.value)
      const json = this.fs.readJSON(location) as unknown as object
      return {...meta, value: json}
    })

    return customTypes
  }

  private handleNewCustomTypes(customTypesDirectory: string): Array<CustomType> {
    const pathToFolder = this.destinationPath(customTypesDirectory)
    const toIgnore = path.join(pathToFolder, 'index.json')

    const customTypes: Array<CustomType> = []

    this.env.sharedFs.each(file => {
      if (file.isNew && file.path.startsWith(pathToFolder) && file.basename === 'index.json' && file.path !== toIgnore) {
        const ct = this.readDestinationJSON(file.path) as unknown as SliceMachineCustomType
        const {json, label, ...meta} = ct
        // renaming these properties for now
        customTypes.push({name: label, ...meta, value: json})
      }
    })

    return customTypes
  }

  /**
   * Read custom-types from mem-fs. This is used to send custom types during repo creation
   *
   * @param {?string} customTypesDirectory - the directory to read the custom types from defaults to 'custom_types'
   * @returns {Array<CustomType>} - or an empty array
   *
   * @example
   * ```ts
   * this.downloadAndExtractZipFrom('https://github.com/prismicio/fake-theme/archive/master.zip, 'fake-theme-master')
   * const customTypes = this.readCustomTypesFrom('custom_types')
   * this.prismic.createRepository({ domain: this.domain, customTypes })
   * ```
   */
  readCustomTypesFrom(maybeCustomTypesDirectory?: string): Array<CustomType> {
    const customTypesDirectory = maybeCustomTypesDirectory || 'customtypes'
    const maybeNewFormat = this.handleNewCustomTypes(customTypesDirectory)

    if (maybeNewFormat.length > 0) return maybeNewFormat
    return this.handleOldCustomTypes(maybeCustomTypesDirectory || 'custom_types')
  }

  /**
   * Used in the theme generator,
   * This reads and formats the documents in the `documentsDirectory` so they can be sent to prismic during repo-creation.
   *
   * @param {?string} documentsDirectory - defaults to 'documents'
   * @returns {Documents} or undefined
   *
   * @example
   * ```ts
   * await this.downloadAndExtractZipFrom('https://github.com/prismicio/fake-theme/archive/master.zip, 'fake-theme-master')
   * const customTypes = this.readCustomTypesFrom('custom_types')
   * const documents = this.readDocumentsFrom('documents')
   * await this.prismic.createRepository({ domain: this.domain, customTypes, documents })
   * ```
   */
  readDocumentsFrom(documentsDirectory = 'documents'): Documents | undefined {
    const pathToDocuments = this.destinationPath(documentsDirectory)
    const pathToSignatureFile = path.join(pathToDocuments, 'index.json')

    if (this.fs.exists(pathToSignatureFile) === false) {
      return
    }

    const documents: Document = {}

    this.env.sharedFs.each(file => {
      if (file.isNew && file.path.startsWith(pathToDocuments) && file.relative !== pathToSignatureFile) {
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

  /**
   * Used in the theme command and generators that use github urls so the inner folder of the downloaded zip can be extracted to mem-fs
   *
   * @param {string} source - a url to a zip file on github.
   * @returns a string that should be the inner folder of the zip file.
   * @example
   * ```ts
   * const url = 'https://github.com/prismicio/fake-theme/archive/master.zip'
   * this.innerFolderFromGitRepo(url) // fake-theme-master
   * ```
   */

  innerFolderFromGitRepo(source: string) {
    const branch = this.branchFromUrl(source)
    const repo = this.gitRepoFromUrl(source)
    return `${repo}-${branch}`
  }

  copySliceTemplate(library: string, sliceName: string) {
    const pathToLib = this.destinationPath(path.join(library, sliceName))

    const sliceId = pascalCaseToSnakeCase(sliceName)

    const description = toDescription(sliceName)

    const slicesDirectoryPath = path.join('.slicemachine', 'assets', library, sliceName)
    const pathToComponentFromStory = path.relative(this.destinationPath(slicesDirectoryPath), pathToLib)
    const pathToModelFromStory = path.join(pathToComponentFromStory, 'model.json')

    const mocksTemplate = fs.readFileSync(this.templatePath('library/slice/mocks.json'), 'utf-8')

    const mocksAsString = ejs.render(mocksTemplate, {sliceId, sliceName, description})

    const mocks = JSON.parse(mocksAsString).map((d: {variation?: string; name: string; [key: string]: any}) => ({id: createStorybookId(d.variation || d.name), ...d}))

    this.fs.copyTpl(
      this.templatePath('library/slice/**'),
      pathToLib,
      {sliceName, sliceId: sliceId, description, pathToComponentFromStory, pathToModelFromStory, mocks, componentTitle: `${library}/${sliceName}`},
    )
    /* for the slicemachine update */

    this.moveDestination(path.join(pathToLib, 'index.stories.*'), slicesDirectoryPath)
    this.moveDestination(path.join(pathToLib, 'mocks.json'), path.join(slicesDirectoryPath, 'mocks.json'))
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
  storybook?: string;
}
