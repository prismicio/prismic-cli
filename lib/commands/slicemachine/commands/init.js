import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import transformConfig from 'babel-transform-config';
import fetch from 'node-fetch';
import inquirer from 'inquirer';
import consola from 'consola';
import ora from 'ora';
import shell from 'shelljs';
import path from 'path';
import urljoin from 'url-join';
import AdmZip from 'adm-zip';
import Mustache from 'mustache';
import Helpers from '../../../helpers';
import Repository from '../../repository';
import Authentication from '../../authentication';
import SliceMachine from '../slicemachine';
import { ctx } from '../../../context';

async function createPrismicRepo(customTypes) {
  const domain = await Repository.chooseDomain();
  await Authentication.connect();
  return Repository.createWithDomain({
    domain,
    customTypes,
  });
}

function handleDependencies(manifest, packageManager = 'npm') {
  const { dependencies, devDependencies } = manifest;
  if (dependencies && Array.isArray(dependencies)) {
    const cmd = packageManager === 'npm' ? 'npm i --save' : 'yarn add';
    shell.exec(`${cmd} ${dependencies.join(' ')}`);
  }
  if (devDependencies && Array.isArray(devDependencies)) {
    const cmd = packageManager === 'npm' ? 'npm i --save-dev' : 'yarn add --dev';
    shell.exec(`${cmd} ${devDependencies.join(' ')}`);
  }
}

function recap(manifest, info) {
  shell.exec('clear');

  consola.success('SliceMachine project was successfully initialised!');
  if (ctx.SliceMachine.isSetup) {
    try {
      const code = readFileSync(path.join(process.cwd(), 'nuxt.config.js'), 'utf8');

      let args = manifest;
      if (manifest.frameworkName === 'Nuxt') {
        args = Object.assign(manifest, {
          module: [
            '@nuxtjs/prismic',
            {
              endpoint: '{{{ apiEndpoint }}}',
              linkResolver: function linkResolver(doc) {
                if (doc.uid === 'page') {
                  return doc.uid === 'homepage' ? '/' : `/${doc.uid}`;
                }
                return '/';
              },
              routes: ['/:uid', '/'],
            },
          ],
        });
      }
      const { code: newCode } = transformConfig(code, 'nuxt', args);

      const finalFile = Mustache.render(newCode, {
        ...args,
        ...info,
      });
      writeFileSync(path.join(process.cwd(), 'nuxt.config.js'), finalFile);
      consola.success('I rewrote your Nuxt configuration file!');
      consola.info('After trying SliceMachine, make sure to check it out!');
      return;
    } catch (e) {
      console.log(e);
      consola.error('An unexpected error occured while rewriting configuration file');
    }
    return;
  }

  const additionalDisplay = Mustache.render(manifest.recap, {
    ...manifest,
    ...info,
  });

  Helpers.UI.display(`\n\n${additionalDisplay}`);
}

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === true);

async function shouldWrite(file, context, type = 'file') {
  const testRes = type === 'file'
    ? shell.test('-f', path.join('.', file)) === false
    : shell.test('-d', path.join('.', file)) === false;
  return context.yes
    || testRes
    || (async () => {
      const question = {
        type: 'list',
        name: 'choice',
        message: `A ${type} named "${file}" already exists. What should I do?`,
        choices: [{
          name: "Skip (don't overwrite)",
          value: 'dont',
        },
        {
          name: 'Overwrite',
          value: 'do',
        },
        ],
      };
      const {
        choice,
      } = await inquirer.prompt([question]);
      return choice === 'do';
    })();
}

const DEBUG = false;
async function init() {
  const { yes } = ctx.SliceMachine;

  if (yes) {
    consola.info('Running in no-confirm mode: some files might be overridden.');
  }

  const framework = await (async function handleFrameworks() {
    const spinner = ora('Downloading framework definitions').start();
    const endpoint = urljoin(ctx.SliceMachine.apiEndoint, 'frameworks');
    const res = await fetch(endpoint);
    spinner.succeed();
    if (res.status !== 200) {
      consola.error(`[SliceMachine/handleFrameworks] Unable to fetch manifests. Error code: ${res.status}`);
      return new Error();
    }
    const frameworks = await res.json();
    const testsByFramework = frameworks.reduce((acc, { currentFmwk, manifest }) => ({
      ...acc,
      [currentFmwk]: manifest.projectTests,
    }), {});

    const frmwk = Object.entries(testsByFramework)
      .reduce((acc, [currentFmwk, tests]) => acc || (testProject(tests) ? currentFmwk : null), null);

    if (!frmwk && !DEBUG) {
      consola.error('Init should be launched inside a Next/Nuxt app');
      consola.info('Did you run this command from the right folder?');
      return new Error();
    }
    if (DEBUG) {
      return 'nuxt';
    }
    return frmwk;
  }());

  if (!framework || framework instanceof Error === true) {
    return consola.info('Exiting...');
  }

  // if (yes) {
  // consola.info("Running in no-confirm mode: some files might be overridden.")
  // if(!yes) {
  //   const question = {
  //     type: "list",
  //     name: "choice",
  //     message: `What would you like to do?`,
  //     choices: [{
  //         name: "Abort (will exit command)",
  //         value: "dont"
  //       },
  //       {
  //         name: "Continue",
  //         value: "do"
  //       }
  //     ]
  //   }
  //   const { choice } = await inquirer.prompt([question]);
  //   if (choice !== 'do') {
  //     return consola.info('Exiting...')
  //   }
  // }
  // }

  const { zip, manifest } = await (async function handleZip() {
    const spinner = ora('Downloading files from server').start();
    const endpoint = urljoin(ctx.SliceMachine.apiEndoint, 'bootstrap');
    const maybeZipPath = await SliceMachine.downloadSlices(endpoint, {
      framework,
      lib: ctx.SliceMachine.lib || ctx.SliceMachine.library || 'vue-essential-slices',
    });

    spinner.succeed();
    if (!maybeZipPath || maybeZipPath instanceof Error === true) {
      consola.error('An error occured while downloading files from server.');
      return { zip: new Error() };
    }
    const z = new AdmZip(maybeZipPath);
    const mnfst = JSON.parse(z.readAsText('manifest.json'));
    z.deleteFile('manifest.json');
    return { zip: z, manifest: mnfst };
  }());

  if (!zip || zip instanceof Error === true) {
    return consola.info('Exiting...');
  }

  const [error, info] = await (async () => {
    const _format = (prismicDomain = 'debug-domain', magicUrl, apiEndpoint = ctx.SliceMachine.endpoint) => Object.assign(
      { prismicDomain },
      magicUrl && { magicUrl },
      apiEndpoint && { apiEndpoint },
    );

    if (!ctx.SliceMachine.noPrismic) {
      const ct = JSON.parse(zip.readAsText('mergedCustomTypes.json'));
      consola.info('Next: create a fresh Prismic repository');
      const r = await createPrismicRepo(ct);

      const [protocol, base] = ctx.base.split('://');
      if (!protocol || !base) return [`Base url "${ctx.base}" is invalid: did you forget to specify protocol?`, null];

      const apiEndpointUrl = `https://${r.domain}.${ctx.base.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}/api/v2`;
      return [null, _format(r.domain, r.magicUrl, apiEndpointUrl)];
    }
    return [null, _format()];
  });
  if (error) return consola.error(error);

  zip.deleteFile('mergedCustomTypes.json');

  const spinner = ora('Installing dependencies').start();
  handleDependencies(manifest);
  spinner.stop();

  await (async function handleFiles() {
    const prompts = manifest.prompts || [];
    for (const prompt of prompts) {
      const { type, promptPath } = prompt;
      const should = await shouldWrite(promptPath, {
        ...manifest,
        ...ctx.SliceMachine,
        yes,
      }, type);

      if (should) {
        const entries = zip.getEntries()
          .filter(e => !e.isDirectory && e.entryName.indexOf(promptPath.concat('/')) !== -1);

        if (!existsSync(promptPath)) {
          mkdirSync(promptPath, {
            recursive: true,
          });
        }
        for (const entry of entries) {
          const file = zip.readAsText(entry.entryName, 'utf8');
          const f = entry.entryName.indexOf('.template.') !== -1
            ? Mustache.render(file, info)
            : file;

          const fileName = entry.entryName.split('.template').join('');
          writeFileSync(fileName, f, 'utf8');
        }
      }
    }
  }());

  (function handleSmFile() {
    const sm = {
      libraries: manifest.libraries,
      ...(info.apiEndpoint ? {
        apiEndpoint: info.apiEndpoint,
      } : null),
    };
    writeFileSync('sm.json', JSON.stringify(sm), 'utf8');
  }());

  return recap(manifest, info);
}

export default true;
export { init };
