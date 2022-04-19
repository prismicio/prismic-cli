import PrismicGenerator, {TemplateOptions} from '@prismicio/prismic-yeoman-generator'
import * as Framework from '../utils/framework'

export interface ThemeOptions extends TemplateOptions {
  source: string;
  configPath: string;
  documentsPath: string;
}

/**
 * The contents of a `prismic-theme.json` file that a theme can include to
 * configure the `prismic theme` command.
 */
interface ThemeConfig {
  /**
  * The Prismic repository name in the theme's Prismic configuration file (e.g.
  * `prismic-configuration.js`) to replace with the new repository name.
  */
  replaceRepositoryName?: string;
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

    this.maybeCreatePrismicRepository({
      domain: this.domain,
      customTypes,
      signedDocuments: documents,
      framework: maybeFramework || 'other',
    }, this.existingRepo).then(res => {
      if (res.data) this.domain = res.data
    })
  }

  async writing() {
    const location = this.destinationPath(this.configPath)

    let themeConfig: ThemeConfig = {}
    try {
      themeConfig = JSON.parse(this.readDestination('prismic-theme.json', {defaults: '{}'}))
    } catch {
      console.error('An invalid `prismic-theme.json` was found. The configuration will be ignored.')
    }

    if (this.existsDestination(this.configPath)) {
      const oldConfig = this.readDestination(this.configPath)
      const oldRepoName = themeConfig.replaceRepositoryName || 'your-repo-name'
      const newConfig = oldConfig.replace(new RegExp(oldRepoName, 'g'), this.domain)
      this.writeDestination(this.configPath, newConfig)
    } else {
      const url = new URL(this.prismic.base)
      url.host = `${this.domain}.${url.host}`
      url.pathname = '/api/v2'
      this.fs.writeJSON(location, {apiEndpoint: url.toString()})
    }
  }

  async install() {
    if (this.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall()
    }
  }
}
