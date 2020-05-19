import getUsage from 'command-line-usage';

export default function help() {
  console.log(getUsage([
    {
      header: 'Synopsis',
      content: '$ prismic <command> <domain> <options>',
    },
    {
      header: 'Examples',
      content: [
        { name: '$ prismic init', summary: 'Create a project from an existing prismic repository.' },
        { name: '$ prismic new', summary: 'Create a project with a new prismic repository.' },
        { name: '$ prismic init foobar', summary: 'Create a project for the foobar repository.' },
        { name: '$ prismic init foobar --folder ~/Desktop/myProject --template NodeJS --noconfirm', summary: 'Create a NodeJS project, non-interactive.' },
        { name: '$ prismic theme https://github.com/prismicio/nodejs-sdk', summary: 'Create a project from a zip file with a new prismic repository.' },
        { name: '$ prismic sm --setup', summary: 'Setup a nuxt.js project with SliceMachine.' },
      ],
    },
    {
      header: 'Command List',
      content: [
        { name: 'quickstart', summary: 'Create a project: initialize a node.js quickstart project with a new prismic repository.' },
        { name: 'init', summary: 'Initialize a project: initialize the code from a template for an existing prismic repository.' },
        { name: 'new', summary: 'Create a project: initialize the code for a new prismic repository.' },
        { name: 'theme', summary: 'Create a project: initialize project from a theme with a new prismic repository.' },
        { name: 'login', summary: 'Login to an existing prismic.io account.' },
        { name: 'logout', summary: 'Logout from an existing prismic.io account.' },
        { name: 'signup', summary: 'Create a new prismic.io account.' },
        { name: 'list', summary: 'List the available code templates.' },
        { name: 'slicemachine | sm', summary: 'Run slicemachine' },

      ],
    },
    {
      header: 'Options',
      optionList: [
        { name: 'email', description: 'The email of the account to use.' },
        { name: 'password', description: 'The password of the account to use.' },
        { name: 'new', summary: 'Create a project with a new prismic repository.' },
        { name: 'users', summary: 'Set of users used to create a Prismic repository' },
        { name: 'folder', description: 'The folder to create the new project.' },
        { name: 'template', description: 'Project template to use (see the list command for available templates).' },
        { name: 'theme-url', summary: 'Uses a Github repo as a theme or a zip' },
        { name: 'conf', description: 'Specify path to prismic configuration file. Used with `theme` command.' },
        { name: 'version', summary: 'Print the version.' },
      ],
    },
  ]));
}

