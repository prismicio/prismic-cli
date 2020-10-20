import getUsage from 'command-line-usage';

export default function help() {
  console.log(getUsage([
    {
      header: 'Synopsis',
      content: '$ prismic sm <command> <options>',
    },
    {
      header: 'Examples',
      content: [
        { name: '$ prismic sm --setup --lib vue-essential-slices --local-path ./slices', summary: 'Setup an existing Nuxt.js project with slicemachine.' },
        { name: '$ prismic sm --ls', summary: 'List all the slices.' },
        { name: '$ prismic sm --create-slice', summary: 'Setup a slice' },
        { name: '$ prismic sm --pull', summary: 'Pull slices from Prismic' },
      ],
    },
    {
      header: 'Command List',
      content: [
        { name: '--ls', summary: 'List all the slices from libraries and the local files.' },
        { name: '--setup', summary: 'Install dependencies and update your project configuration to setup SliceMachine.' },
        { name: '--bootstrap', summary: 'Bootstrap a project with slicemachine from an existing configuration.' },
        { name: '--create-slice', summary: 'Create a new component template in the filesystem and in your Prismic custom types.' },
        { name: '--develop', summary: 'Launch Slices builder localy' },
        { name: '--add-storybook', summary: 'Create a Storybook at the root of your project and configure it to display your local slices.' },
        { name: '--pull', summary: 'Pull your slices definitions from Prismic and interactively synchronize them with your project' },
      ],
    },
    {
      header: 'Options',
      optionList: [
        { name: 'no-prismic', description: 'Skip the creation of a Prismic repository during the setup.' },
        { name: 'local-path', description: 'Specify a local folder that contains slices during the setup.' },
        { name: 'template-path', description: 'Specify the template folder to be used when running create-slice' },
        { name: 'framework', description: 'Specify for which framework you want to create-slice or add-storybook' },
        { name: 'library | --lib', description: 'Specify an external library during the setup. Will take vue-essential-slices by default.' },
      ],
    },
  ]));
}
