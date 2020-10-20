import shell from 'shelljs';
import path from 'path';
import cpy from 'copy-template-dir';
import slash from 'slash';
import { promisify } from 'util';
import { transform } from '@prismicio/babel-transform-config';
import { readFileSync, writeFileSync } from 'fs';

import { Files } from '../../../common/utils';
import Dependencies from '../../../common/dependencies';
import Frameworks from '../common/frameworks';
import Libraries from '../common/libraries';

import { getOrFail as getSmFile } from '../methods/sm';

const copy = promisify(cpy);

const Framework = {
  next: {
    storybookPath: '.storybook',
    localLibBasePath: '..',
    configFile: 'next.config.js',
    useConfig: false,
    useTemplate: true,
    devDependencies: ['@storybook/react', 'babel-loader'],
    storyExtension: '[tj]s',
    scripts: {
      storybook: 'start-storybook -p 8888',
      'build-storybook': 'build-storybook',
    },
    command: 'storybook',
  },
  nuxt: {
    storybookPath: '.nuxt-storybook',
    localLibBasePath: '~',
    configFile: 'nuxt.config.js',
    useConfig: (stories = []) => ({
      'storybook:stories': {
        action: 'create:merge',
        value: stories,
      },
      ignore: {
        action: 'create:merge',
        value: ['**/*.stories.js'],
      },
    }),
    useTemplate: false,
    devDependencies: ['@nuxtjs/storybook@2.2.2'],
    storyExtension: 'js',
    scripts: {
      storybook: 'nuxt storybook',
      'build-storybook': 'nuxt storybook build',
    },
    command: 'storybook',
  },
};

const PackageManager = {
  yarn: {
    cmd: 'yarn',
    installCmd: 'yarn add',
    installDevCmd: 'yarn add --dev',
  },
  npm: {
    cmd: 'npm',
    installCmd: 'npm install --save',
    installDevCmd: 'npm install --save-dev',
  },
};
/*
function execInstall(cmd, deps) {
  if (deps && Array.isArray(deps)) {
    shell.exec(`${cmd} ${deps.join(' ')}`);
  }
} */
const execInstall = Dependencies.install;

function handleDependencies(manifest, packageManager = PackageManager.npm) {
  const {
    dependencies,
    devDependencies,
  } = manifest;
  execInstall(packageManager.installCmd, dependencies);
  execInstall(packageManager.installDevCmd, devDependencies);
}

function writeFileAsJson(jsonPath, content) {
  const filePath = path.resolve(jsonPath);
  if (!Files.exists(filePath)) {
    return null;
  }

  Files.writeJson(filePath, content);
  return true;
}

function getJsonPackage(jsonPackagePath) {
  if (!Files.exists(jsonPackagePath)) {
    return null;
  }

  return Files.readJson(jsonPackagePath);
}

const existsSync = Files.exists;

/* eslint-disable  consistent-return */
export default async function () {
  const framework = Frameworks.get();
  const manifest = Framework[framework];

  // Checks
  if (!manifest) {
    return console.info(`[add-storybook] Framework "${framework}" is not currently supported. Exiting...`);
  }

  const userStorybookPath = slash(path.posix.join(process.cwd(), manifest.storybookPath));
  if (existsSync(userStorybookPath)) {
    return console.info('[add-storybook] Storybook seems already installed. Exiting...');
  }

  const jsonPackagePath = path.posix.join(slash(process.cwd()), 'package.json');
  if (!existsSync(jsonPackagePath)) {
    return console.error('[add-storybook] Could not find package.json file. Exiting...');
  }

  const frameworkConfigPath = path.join(process.cwd(), manifest.configFile);
  if (!existsSync(frameworkConfigPath)) {
    return console.error(`[add-storybook] Could not find ${manifest.configFile} file. Exiting...`);
  }

  /** Check that package.json exists but don't copy it after handling deps */

  // Process
  const sm = getSmFile();
  const localLibs = (await Promise.all(sm.libraries.map(Libraries.infos))).filter(({ isLocal }) => isLocal);
  const storiesMatch = localLibs.map(lib => path.posix.join(
    manifest.localLibBasePath,
    lib.relativePathToLib,
    `/**/*.stories.${manifest.storyExtension}`,
  ));
  const storybookTemplatePath = path.normalize(path.join(__dirname, '../storybook-templates', framework));

  // config file
  if (manifest.useConfig) {
    const frameworkConfig = readFileSync(frameworkConfigPath, 'utf8');
    const transformedConfig = transform(frameworkConfig, manifest.useConfig(storiesMatch));
    writeFileSync(frameworkConfigPath, transformedConfig.code);
  }

  // storybook template
  if (manifest.useTemplate) {
    await copy(
      storybookTemplatePath,
      userStorybookPath, {
        main: 'main',
        storiesMatch: storiesMatch.map(f => `"${f}"`).join(','),
      },
    );
  }

  // package.json
  const packageManager =
    existsSync(slash(path.posix.join(process.cwd(), 'yarn.lock'))) ? PackageManager.yarn : PackageManager.npm;
  handleDependencies(manifest, packageManager);
  const jsonPackage = getJsonPackage(jsonPackagePath);
  const updatedPackage = {
    ...jsonPackage,
    scripts: {
      ...jsonPackage.scripts,
      ...manifest.scripts,
    },
  };

  // exit
  console.info(`[add-storybook] Storybook added at path "${userStorybookPath}"`);

  writeFileAsJson(jsonPackagePath, updatedPackage);
  console.info('[add-storybook] Storybook commands added to package.json file');

  shell.exec(`${packageManager.cmd} run ${manifest.command}`);
}
