import inquirer from 'inquirer';
import shell from 'shelljs';
import { spawn } from 'child_process';
import path from 'path';

import Repository from '../repository';
import Authentication from '../authentication';
import Helpers from '../helpers';

import handleSlices from './handleSlices';
import {
  createPrismicConfigurationFile,
  createLinkResolverPluginFile,
  createPrismicVuePluginFile,
} from './utils';

const LINK_RESOLVER_FILENAME = 'link-resolver.js';
const PRISMIC_VUE_PLUGIN = 'prismic-vue.js';

function failNuxtProject(projectPath = './') {
  const tests = [{
    arg: '-f',
    path: 'nuxt.config.js',
    reason: 'No `nuxt.config.js` file found',
  }, {
    arg: '-d',
    path: 'pages',
    reason: 'No `pages` folder found',
  }];

  // return maybeFailedTest
  return tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === false);
}

function updateNuxtProject({ base, domain }) {
  const projectPath = shell.pwd().toString();
  shell.cp('-r', `${__dirname}/custom_types`, projectPath);
  shell.ShellString(createPrismicConfigurationFile(base, domain)).to(path.join(projectPath, 'prismic.config.js'));
  shell.ShellString(createLinkResolverPluginFile()).to(path.join(projectPath, 'plugins', LINK_RESOLVER_FILENAME));
  shell.ShellString(createPrismicVuePluginFile(LINK_RESOLVER_FILENAME)).to(path.join(projectPath, 'plugins', PRISMIC_VUE_PLUGIN));
}


async function createNuxtApp() {
  const { projectName } = await inquirer.prompt([{
    type: 'input',
    name: 'projectName',
    message: 'Creating a new Nuxt app!\nName of your project (eg. \'project-name\')',
    validate(value) {
      return new RegExp('^[\\-\\w]+$').test(value) ? true : 'Your project name name can only contains alphanumeric characters, underscores or dashes';
    },
  }]);
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['create-nuxt-app', projectName], { stdio: 'inherit' });
    child.on('close', async (code) => {
      if (code == 0) { // eslint-disable-line
        return resolve(projectName);
      }
      return reject(new Error('An error occured.'));
    });
  });
}

async function createPrismicRepo(config, args, customTypes) {
  Helpers.UI.display('About to create a new Prismic repository ✌️');
  Helpers.UI.display('--');
  const d = await Repository.chooseDomain(true, config.base);
  await Authentication.connect(config.base, args);
  const createdDomain = await Repository.createWithDomain(config.base, d, args, customTypes);
  Helpers.UI.display('--');
  return createdDomain;
}

function mergeCustomTypesWithSlices(ct, model) {
  // THIS. IS. UGLY.
  const update = (e, key) => ({
    ...e,
    value: {
      ...e.value,
      [key]: {
        ...e.value[key],
        body: {
          ...e.value[key].body,
          config: {
            ...e.value[key].body.config,
            choices: model,
          },
        },
      },
    },
  });
  if (ct.some(e => e.id === 'page') === false) {
    Helpers.UI.display('Unable to create Prismic custom type with slices asked. Some things may not work as expected. Skipping...');
  }
  return ct.map(e => (e.id === 'page' ? update(e, 'Page') : e));
}

async function init(config, args) {
  const fail = failNuxtProject();
  if (!args['--skip-1'] && (fail || args['--new'])) {
    const res = await createNuxtApp();
    if (res instanceof Error) {
      return Helpers.UI.display('An error occured. Exiting...');
    }
    shell.cd(res);
    const failAfterNuxtCreate = failNuxtProject();
    if (failAfterNuxtCreate) {
      return Helpers.UI.display(`It seems we were not able to cd to your new Nuxt project.\nReason: ${fail.reason}`);
    }
    Helpers.UI.display('\n\n\n\n🎉 Nuxt project created! Now creating a new Prismic project!');
  }

  /*

    1. build needed data (custom_types, etc?)
    2. update and use readZipAndCreateRepoWithCustomTypes
    3. download the zip folder from slices project API
    4. unzip it
    5. add it to ./
    6. exec npm i --save [...]
    7. update nuxt.config.js to add the needed plugins
    8. npm run lint --fix
    9. npm run dev?

   */

  const model = await handleSlices();
  const customTypes = Repository.readCustomTypes(__dirname);
  const finalCustomTypes = mergeCustomTypesWithSlices(customTypes, model);
  console.log(JSON.stringify(finalCustomTypes.find(e => e.id === 'page').value, 'types'));
  const domain = await createPrismicRepo(config, args, finalCustomTypes);
  updateNuxtProject({ base: config.base, domain });
  shell.exec('npm i --save https://github.com/prismicio/prismic-vue.git#nuxt prismic-javascript');
  shell.exec('npm i --save-dev node-sass sass-loader');

  Helpers.UI.display(`Add this to your Nuxt config file before running the app:\nplugins: [
    '~/plugins/${LINK_RESOLVER_FILENAME}',
    '~/plugins/${PRISMIC_VUE_PLUGIN}',
  ]`);
  return null;
}

export default true;
export { init };


/*


Let's get to it!
? Would you like to create a new Nuxt project? (yes or no)
  - yes: Name your Nuxt project
    - npx create-nuxt-app <nuxt-project>
  - no
? Create a new prismic repository? (yes or no)
  - yes:

? Name your prismic repository:  test-from-cli-1
? Local folder to initalize project:  test-from-cli-1
? Technology for your project:  Vue.js
? Do you already have an account on https://prismic.io? No, create a new account
? Email:  hugo2.p.villain@gmail.com
? Password:  [hidden]
You can access your backend here: https://test-from-cli-1.prismic.io
Initialize local project
Running npm install...

 */
