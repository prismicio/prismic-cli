import PrismicGenerator from '@prismicio/prismic-yeoman-generator'
import * as path from 'path'

export default class PrismicNodeJS extends PrismicGenerator {
  /**
   * initializing - Your initialization methods (checking current project state, getting configs, etc)
   *
   * prompting - Where you prompt users for options (where you’d call this.prompt())
   *
   * configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
   *
   * default - If the method name doesn’t match a priority, it will be pushed to this group.
   *
   * writing - Where you write the generator specific files (routes, controllers, etc)
   *
   * conflicts - Where conflicts are handled (used internally)
   *
   * install - Where installations are run (npm, bower)
   *
   * end - Called last, cleanup, say good bye, etc
   */

  async initializing() {
    this.destinationRoot(this.path)
    return this.downloadAndExtractZipFrom('https://github.com/prismicio/nodejs-sdk/archive/master.zip', 'nodejs-sdk-master')
  }

  async configuring() {
    const customTypes = this.readCustomTypesFrom('custom_types')
    return this.prismic.createRepository({
      domain: this.domain,
      customTypes,
    })
    .then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data || this.domain}.${url.host}`
      this.log(`A new repsitory has been created at: ${url.toString()}`)
      return res
    })
    .then(res => {
      const oldConfig = this.readDestination('prismic-configuration.js')
      const newConfig = oldConfig.replace(/your-repo-name/g, res.data || this.domain)
      this.writeDestination('prismic-configuration.js', newConfig)
    })
  }

  install() {
    return this.npmInstall()
  }
}
