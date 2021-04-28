import PrismicGenerator from '@prismicio/prismic-yeoman-generator'
import * as path from 'path'

export default class extends PrismicGenerator {
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
    return this.downloadAndExtractZipFrom('https://github.com/prismicio/angular2-starter/archive/master.zip', 'angular2-starter-master')
  }

  async configuring() {
    return this.prismic.createRepository({
      domain: this.domain,
    }).then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data}.${url.host}`
      this.log(`A new repository has been created at: ${url.toString()}`)
      return res
    })
    .then(res => {
      const location = path.join(this.path, 'src', 'prismic-configuration.ts')
      const oldConfig = this.readDestination(location)
      const newConfig = oldConfig.replace(/your-repo-name/g, res.data || this.domain)
      this.fs.write(location, newConfig)
    })
  }

  async install() {
    return this.npmInstall()
  }
}
