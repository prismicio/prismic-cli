import consola from 'consola';
import ora from 'ora';
import path from 'path';
import urljoin from 'url-join';
import Mustache from 'mustache';
import transformConfig from '@prismicio/babel-transform-config';
import clear from 'cli-clear';

import { ctx } from '../../../context';
import Frameworks from '../common/frameworks';
import Dependencies from '../../../common/dependencies';
import { get as getSmFile, write as writeSmFile } from '../methods/sm';
import bootstrap from './bootstrap';
import CustomTypes from '../../../common/customtypes';
import Helpers from '../../../helpers';
import { Files, Objects } from '../../../common/utils';
import Libraries from '../common/libraries';


function installDependencies(manifest) {
  const spinner = ora('Installing dependencies\n').start();
  const pkgManager = Dependencies.detectPackageManager();
  const { dependencies, devDependencies } = manifest;
  Dependencies.install(pkgManager.installCmd, dependencies);
  Dependencies.install(pkgManager.installDevCmd, devDependencies);
  spinner.stop();
}

function createFiles(files) {
  if (!files || !files.length) return;

  files.forEach(({ name, path: parentPath, content }) => {
    Files.write(path.join(parentPath, name), content);
  });
}

async function loadBootstrapData() /* { manifest, customTypes, slices } */ {
  const spinner = ora('Downloading files from server').start();
  const endpoint = urljoin(ctx.SliceMachine.apiEndpoint, 'bootstrap');
  const result = await Communication.getAsJson(endpoint, {
    framework: Frameworks.get(),
    lib: ctx.SliceMachine.lib,
  });
  spinner.succeed();
  return result;
}

function buildCustomTypes(templates, slices) {
  return Objects.map(templates, ([templateId, templateValue]) => {
    const computedCustomType = CustomTypes.mergeSlices(templateValue, slices);
    return { [templateId]: computedCustomType };
  });
}
async function getProjectSlices(smFile) /* { [sliceId]: sliceModel } */ {
  const modelsByLib = await Promise.all(smFile.libraries.map(lib => Libraries.slicesModels(lib)));

  // If there are name collision, the first libraries in sm.json are ordered by priority
  // Doing the following will merge all slices together by name with the right priority
  return modelsByLib.reverse().reduce((acc, slices) => {
    const slicesModels = slices
      .map(({ id, model }) => ({ [id]: model }))
      .reduce((acc, slice) => ({ ...acc, ...slice }), {});

    return { ...acc, ...slicesModels };
  }, {});
}

function generateProjectConfig(manifest, info) {
  try {
    if (!manifest.configPath) return;
    const configFile = Files.read(path.join(process.cwd(), manifest.configPath));
    const { code: updatedConfigFile } = transformConfig(configFile, manifest.framework, manifest);
    const finalFile = Mustache.render(updatedConfigFile, {
      ...manifest,
      ...info,
    });
    Files.write(path.join(process.cwd(), manifest.configPath), finalFile);

    consola.success(`I rewrote your ${manifest.frameworkName} configuration file!`);
    consola.info('After trying SliceMachine, make sure to check it out!');
    return;
  } catch (e) {
    consola.error('An unexpected error occured while rewriting configuration file');
  }
}

function handleRecap(manifest, info) {
  clear();

  generateProjectConfig(manifest, info);

  const vars = {
    quickStartDocsUrl: 'https://slicemachine.dev/documentation/getting-started',
    addSlicesDocsUrl: 'https://slicemachine.dev/documentation/creating-your-own-components-slices',
    createSliceCommand: '$> npx prismic-cli sm --create-slice',
    writingRoomUrl: info.apiEndpoint ? `${info.apiEndpoint.split('/api')[0].replace('cdn.', '')}/documents` : 'https://prismic.io/dahboard',
    sliceZoneReadmeUrl: 'https://slicemachine.dev/documentation/slicezone',
    communityForumUrl: 'https://community.prismic.io',
  };

  const recap = Files.read(path.join(__dirname, '..', 'misc/recap.mustache'));
  const additionalDisplay = Mustache.render(recap, vars);

  Helpers.UI.display(`\n\n${additionalDisplay}`);
}

async function setup() {
  try {
    const { yes } = ctx.SliceMachine;
    if (yes) consola.info('Running in no-confirm mode: some files might be overridden.');

    const smFile = getSmFile();

    if (!smFile) {
      const newSmFile = {
        libraries: [ctx.SliceMachine.localSlicesPath, ...manifest.libraries],
        ...(info.apiEndpoint ? {
          apiEndpoint: info.apiEndpoint,
        } : null),
      };
      writeSmFile('sm.json', newSmFile);

      const { manifest, customTypes: customTypesTemplates } = await loadBootstrapData();
      installDependencies(manifest);
      createFiles(manifest.files);

      const projectSlices = await getProjectSlices(smFile);
      const customTypes = buildCustomTypes(customTypesTemplates, projectSlices);
      CustomTypes.write(customTypes);
    }

    await bootstrap();

    return handleRecap(manifest, { apiEndpoint });
  } catch (e) {
    return consola.error(e);
  }
}

export default setup;
