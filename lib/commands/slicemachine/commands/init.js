import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import transformConfig from '@prismicio/babel-transform-config';
import consola from 'consola';
import ora from 'ora';
import shell from 'shelljs';
import clear from 'cli-clear';
import path from 'path';
import urljoin from 'url-join';
import AdmZip from 'adm-zip';
import Mustache from 'mustache';
import Helpers from '../../../helpers';
import Repository from '../../repository';
import Authentication from '../../authentication';
import SliceMachine from '../slicemachine';
import { ctx } from '../../../context';

import { determineFrameworkUsed } from '../common/frameworks'

async function createPrismicRepo(customTypes) {
  const domain = await Repository.chooseDomain();
  await Authentication.connect();
  return Repository.createWithDomain({
    domain,
    customTypes,
  });
}

const PackageManager = {
  yarn: {
    installCmd: 'yarn add',
    installDevCmd: 'yarn add --dev'
  },
  npm: {
    installCmd: 'npm i --save',
    installDevCmd: 'npm i --save-dev'
  }
}

function execInstall(cmd, deps) {
  if (deps && Array.isArray(deps)) {
    shell.exec(`${cmd} ${deps.join(' ')}`);
  }
}

function handleDependencies(manifest, packageManager = PackageManager.npm) {
  const { dependencies, devDependencies } = manifest
  execInstall(packageManager.installCmd, dependencies)
  execInstall(packageManager.installDevCmd, devDependencies)
}

function generateProjectConfig(manifest, info, routes) {
  try {
    const configFile = readFileSync(path.join(process.cwd(), manifest.configPath), 'utf8');

    const { code: updatedConfigFile } = transformConfig(configFile, manifest.framework, manifest);
    const finalFile = Mustache.render(updatedConfigFile, {
      ...manifest,
      routes,
      ...info,
    });
    writeFileSync(path.join(process.cwd(), manifest.configPath), finalFile);

    consola.success(`I rewrote your ${manifest.frameworkName} configuration file!`);
    consola.info('After trying SliceMachine, make sure to check it out!');
    return;
  } catch (e) {
    consola.error('An unexpected error occured while rewriting configuration file');
  }
}

function handleRecap(manifest, recap, library, info, routes) {
  clear();

  if (ctx.SliceMachine.isSetup) {
    generateProjectConfig(manifest, info, routes);
  }
  const additionalDisplay = Mustache.render(recap, {
    ...manifest,
    ...library,
    ...info,
  });

  Helpers.UI.display(`\n\n${additionalDisplay}`);
}

const DEBUG = false;
async function init() {
  const {
    yes,
  } = ctx.SliceMachine;

  if (yes) {
    consola.info('Running in no-confirm mode: some files might be overridden.');
  }

  const [frameworkError, framework] = await determineFrameworkUsed(DEBUG)
  if (!framework || frameworkError) {
    return consola.info('Exiting...');
  }

  const { zip, manifest, library, recap, routes } = await (async function handleZip() {
    const spinner = ora('Downloading files from server').start();
    const endpoint = urljoin(ctx.SliceMachine.apiEndpoint, 'bootstrap');
    const maybeZipPath = await SliceMachine.downloadSlices(endpoint, {
      framework,
      lib: ctx.SliceMachine.lib || ctx.SliceMachine.library,
    });
    spinner.succeed();
    if (!maybeZipPath || maybeZipPath instanceof Error === true) {
      consola.error('An error occured while downloading files from server.');
      return { zip: new Error() };
    }
    const z = (() => {
      try {
        return new AdmZip(maybeZipPath);
      } catch (e) {
        consola.error(`Unexpected error: could not instantiate Zip.\n[Full error] ${e}`)
        return new Error()
      }
    })();
    if (z instanceof Error === true) {
      return z
    }
    const bootFile = JSON.parse(z.readAsText('boot.json'));
    z.deleteFile('boot.json');
    return {
      zip: z,
      ...bootFile
    };
  }());

  if (!zip || zip instanceof Error === true) {
    return consola.info('Exiting...');
  }

  const [error, info] = await (async () => {
    const _format = (prismicDomain, magicUrl, apiEndpoint = ctx.SliceMachine.endpoint) => Object.assign(
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

      const apiEndpoint = `${protocol}://${r.domain}.${protocol === 'https' ? 'cdn.' : ''}${ctx.base.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}/api/v2`;
      return [null, _format(r.domain, r.magicUrl, apiEndpoint)];
    }
    return [null, _format()];
  })();

  if (error) return consola.error(error);

  const configFile = Mustache.render(
    readFileSync(path.join(__dirname, '../misc', 'templates', 'prismic.config.mustache'), 'utf8'), {
      apiEndpoint: info.apiEndpoint
    }
  )
  writeFileSync('prismic-configuration.js', configFile, 'utf8');

  zip.deleteFile('mergedCustomTypes.json');

  const spinner = ora('Installing dependencies\n').start();
  const packageManager =
    existsSync(path.join(process.cwd(), 'yarn.lock'))
    ? PackageManager.yarn
    : PackageManager.npm
  handleDependencies(manifest, packageManager);
  spinner.stop();

  (function handleSmFile() {
    const sm = {
      libraries: manifest.libraries,
      ...(info.apiEndpoint ? {
        apiEndpoint: info.apiEndpoint,
      } : null),
    };
    writeFileSync('sm.json', JSON.stringify(sm), 'utf8');
  }());

  return handleRecap(manifest, recap, library, info, routes);
}

export { init };
