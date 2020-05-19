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
      ],
    },
    {
      header: 'Command List',
      content: [
        { name: '--ls', summary: 'List all the slices from libraries and the local files.' },
        { name: '--setup', summary: 'Install dependencies and update your project configuration to setup SliceMachine.' },
        { name: '--create-slice', summary: 'Create a new component template in the filesystem and in your Prismic custom types.' },
      ],
    },
    {
      header: 'Options',
      optionList: [
        { name: 'no-prismic', description: 'Skip the creation of a Prismic repository during the setup.' },
        { name: 'local-path', description: 'Specify a local folders that contains slices during the setup.' },
        { name: 'library | --lib', summary: 'Specify an external library during the setup. Will take vue-essential-slices by default.' },
      ],
    },
  ]));
}
