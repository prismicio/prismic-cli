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
    this.destinationRoot(this.path)
  }

  async configuring() {
    this.config.set('framework', '<%= name %>')
  }

  async prompting() {
    if (!this.pm) await this.promptForPackageManager()
    <% if (slicemachine) { %>
    if (this.options.slicemachine === undefined) {
      this.options.slicemachine = await this.prompt<{slicemachine: boolean}>([{  
        name: 'slicemachine',
        type: 'confirm',
        default: true,
        message: 'Slice Machine',
      }]).then(res => res.slicemachine)
    }
    <% } %> 
  } 

<% if (slicemachine) { %>
  async default() {
    const opts = {framework: '<%= name %>', force: this.force, domain: this.domain, prismic: this.prismic, path: this.destinationRoot(), pm: this.pm, ...this.options}

    if (this.options.slicemachine) {
      this.composeWith('prismic-<%= name %>:slicemachine', opts)
      this.composeWith('prismic-<%= name %>:create-slice', opts)
      this.composeWith('prismic-<%= name %>:storybook', opts)
    }
  }
<% } %>

  async writing() {

    const customTypes = this.readCustomTypesFrom('custom_types')
    return this.prismic.createRepository({
      domain: this.domain,
      customTypes,
      framework: ''
    }).then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data || this.domain}.${url.host}`
      this.log(`A new repsitory has been created at: ${url.toString()}`)
      return res
    })
    .then(res => {
      const location = path.join(this.path, 'prismic-configuration.js')
      const oldConfig = this.fs.read(location)
      const newConfig = oldConfig.replace(/your-repo-name/g, res.data || this.domain)
      this.fs.write(location, newConfig)
    })
  }

  async install() {
    if (this.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall(undefined, {'legacy-peer-deps': true})
    }
  }
}
