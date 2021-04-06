import consola from 'consola';
import ora from 'ora';
import path from 'path';
import urljoin from 'url-join';
import Mustache from 'mustache';
import transformConfig from '@prismicio/babel-transform-config';
import clear from 'cli-clear';

import { ctx } from '../../../context';
import Communication from '../../../services/communication';
import Frameworks from '../common/frameworks';
import Dependencies from '../../../common/dependencies';
import { get as getSmFile, write as writeSmFile } from '../methods/sm';
import bootstrap from './bootstrap';
import CustomTypes from '../../../common/customtypes';
import Helpers from '../../../helpers';
import { Files } from '../../../common/utils';
import Libraries from '../common/libraries';

const SM_LIBRARY = 'slice-machine-ui';

function installDependencies(manifest) {
  const spinner = ora('Installing dependencies\n').start();
  const pkgManager = Dependencies.detectPackageManager();
  const { dependencies, devDependencies } = manifest;
  if (dependencies && dependencies.length) {
    Dependencies.install(pkgManager.installCmd, dependencies);
  }
  const withSliceMachineUi = (devDependencies || []).concat([SM_LIBRARY]);
  Dependencies.install(pkgManager.installDevCmd, withSliceMachineUi);
  spinner.stop();
}

function createFiles(files) {
  if (!files || !files.length) return;

  files.forEach(({ name, path: parentPath, content }) => {
    Files.write(path.join(parentPath, name), content);
  });
}

async function loadBootstrapData(framework) /* { manifest, customTypes, slices } */ {
  const spinner = ora('Downloading files from server').start();
  const endpoint = urljoin(ctx.SliceMachine.apiEndpoint, 'bootstrap');
  const result = await Communication.getAsJson(endpoint, {
    framework,
    lib: ctx.SliceMachine.lib,
  });
  spinner.succeed();
  return result;
}

function buildCustomTypes(templates, slices) {
  return (templates || []).map((template) => {
    const computedCustomType = CustomTypes.mergeSlices(template.value, slices);
    return { ...template, value: computedCustomType };
  });
}
async function getProjectSlices(smFile) /* { [sliceId]: sliceModel } */ {
  const modelsByLib = await Promise.all(smFile.libraries.map((lib) => Libraries.slicesModels(lib)));

  // If there are name collision, the first libraries in sm.json are ordered by priority
  // Doing the following will merge all slices together by name with the right priority
  return modelsByLib.reverse().reduce((acc, slices) => {
    const slicesModels = Object.entries(slices)
      .map(([, { id, model }]) => ({ [id]: model }))
      .reduce((objAcc, model) => ({ ...objAcc, ...model }), {});

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

  const sliceZoneReadmeUrl = () => {
    switch (manifest.framework) {
      case 'nuxt': return 'https://prismic.io/docs/technologies/vue-slicezone-technical-reference';
      case 'next': return 'https://github.com/prismicio/slice-machine/tree/master/packages/next-slicezone';
      default: return 'https://github.com/prismicio/slice-machine/';
    }
  };

  const quickStartDocsUrl = () => {
    switch (manifest.framework) {
      case 'nuxt': return 'https://prismic.io/docs/technologies/nuxtjs';
      case 'next': return 'https://prismic.io/docs/technologies/quick-start-nextjs';
      default: return 'https://slicemachine.dev/documentation/getting-started';
    }
  };

  const addSlicesDocsUrl = () => {
    switch (manifest.framework) {
      case 'nuxt': return 'https://prismic.io/docs/technologies/generate-model-component-nuxtjs';
      case 'next': return 'https://prismic.io/docs/technologies/create-your-own-slices-components-nextjs';
      default: return 'https://www.slicemachine.dev/';
    }
  };

  const vars = {
    quickStartDocsUrl: quickStartDocsUrl(),
    addSlicesDocsUrl: addSlicesDocsUrl(),
    createSliceCommand: 'npx prismic-cli sm --create-slice',
    writingRoomUrl: info.apiEndpoint ? `${info.apiEndpoint.split('/api')[0].replace('cdn.', '')}/documents` : 'https://prismic.io/dahboard',
    sliceZoneReadmeUrl: sliceZoneReadmeUrl(),
    communityForumUrl: 'https://community.prismic.io',
  };

  const recap = Files.read(path.join(__dirname, '..', 'misc/recap.mustache'));
  const additionalDisplay = Mustache.render(recap, vars);

  Helpers.UI.display(`\n\n${additionalDisplay}`);
}

/* eslint-disable  consistent-return */
async function setup() {
  try {
    const { yes } = ctx.SliceMachine;
    if (yes) consola.info('Running in no-confirm mode: some files might be overridden.');

    const smFile = getSmFile();

    if (!smFile) {
      const framework = Frameworks.get();
      if (!framework) {
        return null;
      }
      const { manifest, customTypes: customTypesTemplates } = await loadBootstrapData(framework);
      const newSmFile = {
        apiEndpoint: ctx.SliceMachine.apiEndpoint,
        libraries: [ctx.SliceMachine.localSlicesPath, ...manifest.libraries],
      };
      writeSmFile(newSmFile);

      installDependencies(manifest);
      createFiles(manifest.files);

      const projectSlices = await getProjectSlices(newSmFile);
      const customTypes = buildCustomTypes(customTypesTemplates, projectSlices);
      CustomTypes.write(customTypes);
      const apiEndpoint = await bootstrap(customTypes);
      return handleRecap(manifest, { apiEndpoint });
    }
    await bootstrap();
    console.log('Your SliceMachine repository was successfully created!');
    return;
  } catch (e) {
    return consola.error(e);
  }
}

export default setup;
