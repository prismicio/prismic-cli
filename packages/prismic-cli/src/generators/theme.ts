import PrismicGenerator, {TemplateOptions} from '@prismicio/prismic-yeoman-generator'
import {AxiosResponse} from 'axios'
import cli from 'cli-ux'
import * as Framework from '../utils/framework'

export interface ThemeOptions extends TemplateOptions {
  source: string;
  configPath?: string;
}

export default class PrismicTheme extends PrismicGenerator {
  source: string

  customTypesPath: string

  documentsPath: string

  configPath: string

  constructor(argv: string | string[], opts: ThemeOptions) {
    super(argv, opts)
    this.source = opts.source
    this.customTypesPath = opts.customTypesPath
    this.documentsPath = opts.documentsPath
    this.configPath = opts.configPath || 'prismic-configuration.js'
  }

  async initializing() {
    this.destinationRoot(this.path)
    const innerFolder = this.innerFolderFromGitRepo(this.source)
    return this.downloadAndExtractZipFrom(this.source, innerFolder)
  }

  async prompting() {
    this.pm = await this.promptForPackageManager()
  }

  async configuring() {
    const customTypes = this.readCustomTypesFrom(this.customTypesPath)
    const documents = this.readDocumentsFrom(this.documentsPath)

    const pkg: Framework.PkgJson | null = (() => {
      const pkgPath = this.destinationPath('package.json')
      if (this.fs.exists(pkgPath) === false) {
        return null
      }
      return this.fs.readJSON(pkgPath) as Framework.PkgJson
    })()

    if (!pkg) console.error('NO PKG FOUND')

    const maybeFramework = pkg && Framework.detect(pkg)

    cli.action.start('Creating prismic repository')
    return this.prismic.createRepository({
      domain: this.domain,
      customTypes,
      signedDocuments: documents,
      framework: maybeFramework || 'other',
    })
    .then((res: AxiosResponse<any>) => {
      cli.action.stop()
      const url = new URL(this.prismic.base)
      url.host = `${res.data || this.domain}.${url.host}`
      this.log(`A new repository has been created at: ${url.toString()}`)

      const location = this.destinationPath(this.configPath)
      if (this.fs.exists(location)) {
        const oldConfig = this.fs.read(location)
        const newConfig = oldConfig.replace(/your-repo-name/g, res.data || this.domain)
        this.fs.write(location, newConfig)
      } else {
        url.pathname = '/api/v2'
        this.fs.writeJSON(location, {
          apiEndpoint: url.toString(),
        })
      }
    })
  }

  async install() {
    if (this.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall()
    }
  }
}
