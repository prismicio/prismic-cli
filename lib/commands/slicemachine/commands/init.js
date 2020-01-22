import { readFileSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import shell from 'shelljs';
import path from 'path';
import { spawn } from 'child_process';
import AdmZip from 'adm-zip';
import Mustache from 'mustache';
import Helpers from '../../../helpers';
import Repository from '../../repository';
import Authentication from '../../authentication';
import SliceMachine from '../slicemachine';
import createEndpoints from '../misc/createEndpoints';
import { ctx } from '../../../context';
import Sentry from '../../../services/sentry';

readFileSync(path.join(__dirname, '../misc', 'sl.txt'), 'utf8');

const renderText = (file, vars) =>
  Mustache.render(readFileSync(path.join(__dirname, '../misc', file), 'utf8'), vars);

// Create a consts file instead
const SLICE_MACHINE_FOLDER = 'sliceMachine';

async function promptForPrismicApp() {
  const question = {
    type: 'list',
    name: 'choice',
    message: 'Hey! It seems you already have a Prismic configuration file.\nHow would you like to proceed?\n',
    choices: [{
      name: 'Don\'t overwrite my configuration',
      value: 'dont',
    }, {
      name: 'Create a new Prismic repo anyway (will overwrite your Prismic config file)',
      value: 'do',
    }],
  };
  const { choice } = await inquirer.prompt([question]);
  return choice === 'do';
}

async function createApp(bootstraper, frameworkName, skipDisplay) {
  if (!skipDisplay) {
    Helpers.UI.display(renderText('templates/initStep1.mustache', { frameworkName }));
  }
  const { projectName } = await inquirer.prompt([{
    type: 'input',
    name: 'projectName',
    message: 'Where should we create your app? Folder name:',
    validate(value) {
      return new RegExp('^[\\-\\w]+$').test(value) ? true : 'Your project name can only contain alphanumeric characters, underscores or dashes';
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

async function createPrismicRepo(customTypes) {
  const domain = await Repository.chooseDomain();
  await Authentication.connect();
  const createdDomain = await Repository.createWithDomain({
    domain,
    customTypes,
  });
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
  const apiBase = `${protocol}${domain}.${url}`;
  const apiUrl = `${apiBase}/api/v2`;
  const documentsUrl = `${apiBase}/documents`;
  zip.deleteFile(fileName);
  writeFileSync(fileName, f.replace(pattern, apiUrl), 'utf8');
  return { apiUrl, documentsUrl };
}


// The following function is commented for beta usage it needs to be fixed
// using old solution instead
// function recap(protocol, info) {
//   const {
//     isBootstrapped,
//     newPrismicRepo,
//     projectName,
//   } = info;

//   shell.exec('clear');

//   Helpers.UI.display(renderText('templates/initRecap.mustache'), {
//     ...protocol,
//     isBootstrapped,
//     newPrismicRepo,
//     projectName,
//     prismicConfigSrc: protocol.prismicConfig,
//     sliceMachineFolder: SLICE_MACHINE_FOLDER,
//     projectUrl: `${__dirname}/${projectName}`,
//   });
// }

// Recap function old solution :
function recap(protocol, info) {
  const {
    isBootstrapped,
    newPrismicRepo,
    projectName,
    prismicDomain,
  } = info;

  shell.exec('clear');
  Helpers.UI.display('---- ALL DONE ----\n\nRecap:');

  if (isBootstrapped) {
    Helpers.UI.display(`- We created a new ${protocol.frameworkName} project (${projectName}) \n`);
  }
  if (newPrismicRepo) {
    Helpers.UI.display(`- We created a new Prismic repository, accessible here: ${newPrismicRepo.documentsUrl}`);
    Helpers.UI.display(`- We added a ${protocol.prismicConfig} file for you.\n`);
  }
  Helpers.UI.display(`- We added slices and a SliceZone in '${SLICE_MACHINE_FOLDER}' - a folder at the root of your project.`);
  Helpers.UI.display(`- We added examples in your '${protocol.examplesFolder}'`);

  Helpers.UI.display(`- To launch the project, run: \`cd ${projectName}; ${protocol.firstCommand};\``);

  if (protocol.additionalDisplay) {
    const additionalDisplay = protocol.additionalDisplay.replace('<REPOSITORY>', prismicDomain);
    Helpers.UI.display(`\n\n${additionalDisplay}`);
  }
}


function clean(zip, protocol) {
  zip.deleteFile(protocol.pathToMergedSlices);
  zip.deleteFile('protocol.json');
}

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === false);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function init() {
  const framework = ctx.SliceMachine.framework || 'nuxt';
  const info = {};

  Helpers.UI.display(renderText('templates/sm-intro.mustache'));

  try {
    const Endpoints = createEndpoints();
    const endpoint = Endpoints.SliceMachine.slices();
    const maybeZipPath = await SliceMachine.downloadSlices(endpoint, { framework, ...(ctx.SliceMachine.isDemo ? { demo: true } : {}) });
    if (maybeZipPath && maybeZipPath instanceof Error === false) {
      const zip = new AdmZip(maybeZipPath);
      const protocol = JSON.parse(zip.readAsText('protocol.json'));

      /**
       * Beginning of us starting testing then creating app.
       * If we are in a given project (eg. Nuxt), continue.
       * If not, get bootstraper for given app (eg. Nuxt),
       * launch the command then cd to created directory.
       * If we are in a Nuxt project, everything went fine.
       * If not, we can't continue and exit the process.
       */
      const maybeFail = testProject(protocol.projectTests);
      if (!ctx.SliceMachine.skipBootstraper && (maybeFail || ctx.SliceMachine.isNew)) {
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
      if (!ctx.SliceMachine.skipPrismic && (info.isBootstrapped || shell.test('-e', protocol.prismicConfig) === false || await promptForPrismicApp())) {
        Helpers.UI.display(renderText('templates/initStep2.mustache'));
        const ct = JSON.parse(zip.readAsText(protocol.pathToMergedSlices));
        const domain = await createPrismicRepo(ct);
        const urls = writePrismicConfig(zip, protocol.prismicConfig, { domain, base: ctx.base });

        info.prismicDomain = domain;
        info.newPrismicRepo = urls;
      }

      /**
       * Handle npm dev + dependencies
       */
      Helpers.UI.display(renderText('templates/initStep3.mustache'));
      handleDependencies(protocol);


      /**
       * Remove zipped files that should not stay there.
       * We maybe could mention them in actions.
       */
      clean(zip, protocol);

      Helpers.UI.display(renderText('templates/initStep4.mustache'));
      zip.extractAllTo(path.join('./', SLICE_MACHINE_FOLDER), true);
      sleep(800);

      recap(protocol, info);
    } else {
      throw new Error('An error occured. We did not manage to query your slices.\nContact us maybe? Now exiting...');
    }
  } catch (e) {
    Sentry.report(e);
    return Helpers.UI.display(e);
  }
  return null;
}

export default init;
