# Prismic Generator Generator.

Used for generating prismic projects for use with the prismic-cli. It creates a customized [yeoman-generator](https://yeoman.io/authoring/) with some additional methods added by [prismic-yeoman-generator](../prismic-yeoman-generator/README.md).

## Usage

First install the latest version of the prismic cli
`npm install -g prismic-cli@alpha`

Then run the `create-generator` command.

#### Prompts

###### Name
Name of the generator, `generator-prismic-` will be prefixed to the input. This is prefixed so `prismic-cli` can determine which generators are compatible with the cli.

###### Language
Both JavaScript and Typescript are supported as languages for writing a generator.

###### Package manager
Use yarn or npm, yarn tends to work better with mono-repositories, but it's really down to personal preference.

###### Slicemachine
This adds the file and folder structure for the sm commands.


#### Folder structure
After prompting the cli will generate a `yeoman-generator` following file and folder structure.

###### /generators/app
When run this sub-generator should create a working sample project + prismic.
there are three options to do this.
1. The standard yeoman way for writing generators where the files and folders are kept in app/tempmlates. These files can be interpreted as _ejs_ which allows variables like _domain_ to be passed to te templates. (example: `prismic-generator-nextjs`)
2. Download a project from a github repository. This is easier to get started with but less Flexible ini regards to modifying files. (example `prismic-generator-vue` or `prismic-cli/src/generatos/theme`)
3. Reverse engineer an existing generator, a lot of frameworks provided their own generators that can be reverse-engineered to run in yeoman. (example `prismic-generator-nuxt`)

###### /generators/slicemachine
This sub-generator installs slicemachine-ui and configures the project to use slicemachine and installs dependacies like `slice-zone`

###### /generators/create-slice
As the name suggests this sub-generator is run to add a new slice to the project. Only one file here needs to be modified and that's the templates/library/slice/index.js file. This file will be handed data from the user inputs during the prompts (sliceName) and create a generic slice in the language beiing used 
TODO: show example for svelt

###### /generators/storybook
This installs and configures storybook.
Storybook does have a cli to handle this, but I've not been able to reverse engineer it to be compatible with yeoman. yeoman's `this.spawnCommand` might be te easiest way to install storybook, but this won't work until after the files have been writen out so try and put it in the `end` part of the yeoman life cycle. Or run it and find what modifications where done and emulate those.


#### Running the generator locally.
From the root of the generator run `npm link` this will allow te generator to be discovered by the `prismic new` and `prismic sm` commands.
