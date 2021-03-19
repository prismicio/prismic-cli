import Generator from '../../../src/generators/base'

export default class extends Generator {
   async initializing() {
     // Your initialization methods (checking current project state, getting configs, etc)
   }
   async prompting() {
     // Where you prompt users for options (where you’d call this.prompt())
   }
   async configuring() {
     // Saving configurations and configure the project (creating .editorconfig files and other metadata files)
   }
   async default() {
     // If the method name doesn’t match a priority, it will be pushed to this group.
   }
   async writing() {
     // Where you write the generator specific files (routes, controllers, etc)
   }
   async conflicts() {
     // Where conflicts are handled (used internally)
   }
   async install() {
     // Where installations are run (npm, bower)
   }
   async end() {
     // Called last, cleanup, say good bye, etc
     this.log("Done running the generator")
   }
}

