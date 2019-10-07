import { readFileSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import shell from 'shelljs';
import path from 'path';
import { spawn } from 'child_process';
import AdmZip from 'adm-zip';
import Helpers from '../helpers';
import handleQuery from './handleQuery';
import Repository from '../repository';
import Authentication from '../authentication';

const intro = readFileSync(path.join(__dirname, 'misc', 'sl.txt'), 'utf8');

const text1 = ({ frameworkName }) => `/** ------
 *  1/3 It seems you're not inside a ${frameworkName} app.
 *      About to create 1, just for you:
 ** -------*/
 `;

// Create a consts file instead
const SLICE_MACHINE_FOLDER = 'sliceMachine';

async function promptForPrismicApp() {
  const question = {
    type: 'list',
    name: 'choice',
    message: 'Hey! It seems you already have a Prismic configuration file.\nHow would you like to proceed?\n',
    choices: [{
      name: 'I already have a Prismic project. Don\'t overwrite my configuration',
      value: 'dont',
    }, {
      name: 'Create a Prismic app anyway (will overwrite your Prismic config file and custom_types folder)',
      value: 'do',
    }],
  };
  const { choice } = await inquirer.prompt([question]);
  return choice === 'do';
}

async function createApp(bootstraper, frameworkName, skipDisplay) {
  if (!skipDisplay) {
    Helpers.UI.display(text1({ frameworkName }));
  }
  const { projectName } = await inquirer.prompt([{
    type: 'input',
    name: 'projectName',
    message: 'Repository name:',
    validate(value) {
      return new RegExp('^[\\-\\w]+$').test(value) ? true : 'Your project name name can only contains alphanumeric characters, underscores or dashes';
    },
  }]);
  return new Promise((resolve, reject) => {
    // [npx, [nuxt-create-app]]
    const [command, args] = bootstraper;
    const child = spawn(command, [...args, projectName], { stdio: 'inherit' });
    child.on('close', async (code) => {
      if (code === 0) {
        return resolve(projectName);
      }
      return reject(new Error('An error occured.'));
    });
  });
}

async function createPrismicRepo(config, args, customTypes) {
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
      type: actionType,
      zipPath,
      writePath,
    } = action;
    // delete should be handled differently
    if (actionType && actionType === 'delete') {
      return zip.deleteFile(zipPath);
    }
    const shouldWrite = shouldWritePath(action, isBootstrapped);
    if (shouldWrite) {
      zip.extractEntryTo(writePath || zipPath, './', true, shouldOverWrite(action, isBootstrapped));
      zip.deleteFile(zipPath);
    }
    return null;
  });
}

function writePrismicConfig(zip, fileName, { domain, base }) {
  const pattern = /http(s)?:\/\/.*(\.cdn)?\..*\..*\/api(\/v2)?/;

  const matches = base ? base.match(/(https?:\/\/)(.*)/) : ['http://', 'prismic-url-not-found'];
  const protocol = matches[1];
  const url = matches[2];

  const f = zip.readAsText(fileName, 'utf8');
  const value = `${protocol}${domain}.${url}/api/v2`;
  zip.deleteFile(fileName);
  writeFileSync(fileName, f.replace(pattern, value), 'utf8');
  return value;
}

function recap(protocol, info) {
  const {
    isBootstrapped,
    newPrismicRepo,
    projectName,
  } = info;

  shell.exec('clear');
  Helpers.UI.display('---- ALL DONE ----\n\nRecap:');

  if (isBootstrapped) {
    Helpers.UI.display(`- You created a new ${protocol.frameworkName} project (cd. ${projectName}) \n`);
  }
  if (newPrismicRepo) {
    Helpers.UI.display(`- we created a new Prismic repository, accessible here: ${newPrismicRepo}`);
    Helpers.UI.display(`- we added a ${protocol.prismicConfig} file for you.\n`);
  }
  Helpers.UI.display(`- we added [x] slices and a SliceZone in '${SLICE_MACHINE_FOLDER}' - a folder at the root of your project.`);
  Helpers.UI.display(`- we added examples in your '${protocol.examplesFolder}'`);

  Helpers.UI.display(`- To launch the project, run: 'cd ${projectName}; ${protocol.firstCommand};'`);

  if (protocol.additionalDisplay) {
    Helpers.UI.display(`\n\n${protocol.additionalDisplay}`);
  }
}

/**
 * These files are the only files that should not be deleted via actions.
 * They exist in every type of project (Nuxt, Next etc.) and are handled by the CLI
 */
function clean(zip, protocol) {
  zip.deleteFile(protocol.pathToMergedSlices);
  zip.deleteFile('protocol.json');
}

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === false);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function init(config, args) {
  const framework = 'nuxt';
  const info = {};

  Helpers.UI.display(intro);
  try {
    const maybeZipPath = await handleQuery(args['--dev'], { framework });
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
      if (!args['--skip-bootstraper'] && (maybeFail || args['--new'])) {
        const { bootstraper } = protocol;
        const res = await createApp(bootstraper, protocol.frameworkName);
        if (res instanceof Error) {
          return Helpers.UI.display(`An error occured while calling '${bootstraper.join(' ')}'. Exiting...`);
        }
        info.projectName = res;
        shell.cd(res);
        const failAgain = testProject(protocol.projectTests);
        if (failAgain) {
          return Helpers.UI.display(`It seems we were not able to cd to your new ${protocol.frameworkName} project.\nReason: ${maybeFail.reason}`);
        }

        info.isBootstrapped = true;
        shell.exec('clear');
      }

      handleActions(zip, protocol.actions, info.isBootstrapped);


      /** ------
       *  1/3 Beginning of us testing and creating Prismic repository
       ** -------*/

      /**
       *  If project is new or no Prismic config was found or user agreed to override,
       *  parse the custom_types merged with slices, then create Prismic repository.
       *  Then, read prismic config from zip, update it accordingly (domain + base) then write it to fs
       */
      if (!args['--skip-prismic'] && (info.isBootstrapped || shell.test('-e', protocol.prismicConfig) === false || await promptForPrismicApp())) {
        Helpers.UI.display(`/** ------
         *  2/4 Now let's create a fresh Prismic repository.
         *      You'll get a fresh domain, setup with the slices you selected!
         ** -------*/`);
        const ct = JSON.parse(zip.readAsText(protocol.pathToMergedSlices));
        const domain = await createPrismicRepo(config, args, ct);
        const url = writePrismicConfig(zip, protocol.prismicConfig, { domain, base: config.base });

        info.newPrismicRepo = url;
      }

      /**
       * Handle npm dev + dependencies
       */
      Helpers.UI.display(`/** ------
       *  3/4 Installing dependencies...
       *      It could take a while (but usually not)!
       ** -------*/`);
      handleDependencies(protocol);


      /**
       * Remove zipped files that should not stay there.
       * We maybe could mention them in actions.
       */
      clean(zip, protocol);

      Helpers.UI.display(`/** ------
       *  4/4 Extracting cool stuff...
       ** -------*/`);
      zip.extractAllTo(path.join('./', SLICE_MACHINE_FOLDER), true);
      sleep(800);

      recap(protocol, info);
    } else {
      throw new Error('An error occured. We did not manage to query your slices.\nContact us maybe? Now exiting...');
    }
  } catch (e) {
    return Helpers.UI.display(e);
  }
  return null;
}

export default true;
export { init };
