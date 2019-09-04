// import fs from 'fs';
import inquirer from 'inquirer';
import shell from 'shelljs';
import path from 'path';
import { spawn } from 'child_process';
import AdmZip from 'adm-zip';
import Helpers from '../helpers';
import handleQuery from './handleQuery';
import Repository from '../repository';
import Authentication from '../authentication';

async function promptForPrismicApp() {
  const question = {
    type: 'list',
    name: 'choice',
    message: 'Hey! It seems you already have a Prismic configuration file.\nHow would you like to proceed?\n',
    choices: [{
      name: 'DON\'t overwrite and skip creating a new Prismic app',
      value: 'dont',
    }, {
      name: 'Create a Prismic app anyway (may overwrite your config file and custom_types folder)',
      value: 'do',
    }],
  };
  const { choice } = await inquirer.prompt([question]);
  return choice === 'do';
}

async function createApp(bootstraper, frameworkName) {
  const { projectName } = await inquirer.prompt([{
    type: 'input',
    name: 'projectName',
    message: `Creating a new ${frameworkName} app!\nName of your project (eg. 'project-name')`,
    validate(value) {
      return new RegExp('^[\\-\\w]+$').test(value) ? true : 'Your project name name can only contains alphanumeric characters, underscores or dashes';
    },
  }]);
  return new Promise((resolve, reject) => {
    // [npx, [nuxt-create-app]]
    const [command, args] = bootstraper;
    const child = spawn(command, [...args, projectName], { stdio: 'inherit' });
    child.on('close', async (code) => {
      console.log(code, typeof code);
      if (code === 0) {
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

function handleDependencies(protocol) {
  const { dependencies, devDependencies } = protocol;
  if (dependencies && Array.isArray(dependencies)) {
    shell.exec(`npm i --save ${dependencies.join(' ')}`);
  }
  if (devDependencies && Array.isArray(devDependencies)) {
    shell.exec(`npm i --save-dev ${devDependencies.join(' ')}`);
  }
}

const IS_BOOTSTRAPPED = false;
// Should we prompt or not? Ask Renaud
const SHOULD_PROMPT = false;
const prompt = () => true;

const shouldOverWrite = (action, projectIsBootstrapped) => {
  const { overwrite, bootstrapped } = action;
  return overwrite || (bootstrapped && projectIsBootstrapped);
};

/**
 * If path should always be overwritten or path to file does nor exist
 * Or file exists but it was just boostrapped by npx create-app.
 * Alternatively, prompt the user to decide
 * @param  {Object} action The action as stored in protocol.json
 * @return {Boolean}        Yes or no?
 */
const shouldWritePath = (action, projectIsBootstrapped) => {
  const {
    zipPath,
    writePath,
  } = action;
  return shell.test('-e', writePath || zipPath) === false ||
    shouldOverWrite(action, projectIsBootstrapped) || (SHOULD_PROMPT && prompt());
};

/**
 * Takes an array of actions (mainly "write") from protocol
 * and executes them sequentially, based on specification + project boostrapped or not
 * @param  {Zip}  zip            zip instance
 * @param  {Array}  actions        Array of actions to perform over the project
 * @param  {Boolean} isBootstrapped Was the project bootstrapped by us?
 * @return {Undefined}                 No return
 */
function handleActions(zip, actions, isBootstrapped) {
  actions.forEach((action) => {
    const {
      zipPath,
      writePath,
    } = action;
    const shouldWrite = shouldWritePath(action, isBootstrapped);
    if (shouldWrite) {
      zip.extractEntryTo(zipPath, path.join('./', writePath || zipPath), true, shouldOverWrite(action, isBootstrapped));
    }
  });
}

function writePrismicConfig(zip, fileName, args) {
  console.log(`get zip ${fileName} then write to file by overwriting domain + base from ${args}`);
}

function displayInfo(protocol, info) {
  const {
    isBootstrapped,
    newPrismicRepo,
  } = info;

  Helpers.UI.display('---- ALL DONE ----');

  if (isBootstrapped) {
    Helpers.UI.display(`- we created a new ${protocol.frameworkName} app for you`);
  }
  if (newPrismicRepo) {
    Helpers.UI.display(`- we created a new Prismic repository for you: ${newPrismicRepo}`);
  }
}

function clean(zip, protocol) {
  zip.deleteFile(protocol.pathToMergedSlices);
  zip.deleteFile('protocol.json');
}

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === false);

async function init(config, args) {
  const framework = 'nuxt';
  const info = {};
  try {
    const maybeZipPath = await handleQuery({ framework });
    if (maybeZipPath && maybeZipPath instanceof Error === false) {
      const zip = new AdmZip(maybeZipPath);
      const protocol = JSON.parse(zip.readAsText('protocol.json'));

      /**
       * Beginning of us starting testing then creating app.
       * If we are in a givne project (eg. Nuxt), continue.
       * If not, get bootstraper for given app (eg. Nuxt),
       * launch the command then cd to created directory.
       * If we are in a Nuxt project, everything went fine.
       * If not, we can't continue and exit the process.
       */

      const maybeFail = testProject(protocol.projectTests);
      if (maybeFail || args['--new']) {
        const { bootstraper } = protocol;
        const res = await createApp(bootstraper, protocol.frameworkName);
        if (res instanceof Error) {
          return Helpers.UI.display(`An error occured while calling '${bootstraper.join(' ')}'. Exiting...`);
        }
        shell.cd(res);
        const failAgain = testProject(protocol.projectTests);
        if (failAgain) {
          return Helpers.UI.display(`It seems we were not able to cd to your new ${protocol.frameworkName} project.\nReason: ${maybeFail.reason}`);
        }

        info.isBootstrapped = true;
      }

      handleActions(zip, protocol.actions, IS_BOOTSTRAPPED);


      /**------
       * Beginning of us testing and creating Prismic repository
       *-------
       */

      /**
       *  If project is new or no Prismic config was found or user agreed to override,
       *  parse the custom_types merged with slices, then create Prismic repository.
       *  Then, read prismic config from zip, update it accordingly (domain + base) then write it to fs
       */
      if (IS_BOOTSTRAPPED || shell.test('-e', protocol.prismicConfig) === false || await promptForPrismicApp()) {
        const ct = JSON.parse(zip.readAsText(protocol.pathToMergedSlices));
        const domain = await createPrismicRepo(config, args, ct);
        writePrismicConfig(zip, protocol.prismicConfig, { domain, base: config.base });

        info.newPrismicRepo = domain;
      }

      /**
       * Handle npm dev + dependencies
       */
      handleDependencies(protocol);


      clean(zip, protocol);

      zip.extractAllTo('./sliceMachine', true);

      displayInfo(protocol, info);
    } else {
      throw new Error('An error occured. Impossible to query slices (or access /tmp?)');
    }
  } catch (e) {
    return Helpers.UI.display(e);
  }

  /*
    // Helpers.UI.display(`Add this to your Nuxt config file before running the app:\nplugins: [
    //   '~/plugins/${LINK_RESOLVER_FILENAME}',
    //   '~/plugins/${PRISMIC_VUE_PLUGIN}',
    // ]`);
   */
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
