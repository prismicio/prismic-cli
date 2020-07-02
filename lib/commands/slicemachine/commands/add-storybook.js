import shell from 'shelljs';
import { writeFileSync } from 'fs';
import { Files } from '../../../common/utils';
import path from 'path';
import cpy from 'copy-template-dir';
import slash from 'slash';
import { promisify } from 'util';

import Frameworks from '../common/frameworks';
import Libraries from '../common/libraries';


import { getOrFail as getSmFile } from '../methods/sm';

const copy = promisify(cpy);

const Framework = {
  next: {
    devDependencies: ['@storybook/react', 'babel-loader'],
    storyExtension: '[tj]s',
    scripts: {
      storybook: 'start-storybook -p 8888',
      'build-storybook': 'build-storybook',
    },
    command: 'storybook',
  },
  nuxt: {
    devDependencies: ['@storybook/vue', 'vue-loader', 'vue-template-compiler', '@babel/core', 'babel-loader', 'babel-preset-vue'],
    storyExtension: '[tj]s',
    scripts: {
      storybook: 'start-storybook -p 8888',
      'build-storybook': 'build-storybook',
    },
    command: 'storybook',
  },
};

function installDependencies(manifest, pkgManager) {
  const { dependencies, devDependencies } = manifest;
  Dependencies.install(pkgManager.installCmd, dependencies);
  Dependencies.install(pkgManager.installDevCmd, devDependencies);
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

/* eslint-disable  consistent-return */
export default async function () {
  const framework = Frameworks.get();
  const manifest = Framework[framework];
  if (!manifest) {
    return console.log(`[add-storybook] Framework "${framework}" is not currently supported. Exiting...`);
  }

  const userStorybookPath = slash(path.posix.join(process.cwd(), '.storybook'));
  if (Files.exists(userStorybookPath)) {
    return console.log('[add-storybook] Storybook is already installed. Exiting...');
  }

  const jsonPackagePath = path.posix.join(slash(process.cwd()), 'package.json');

  /** Check that package.json exists but don't copy it after handling deps */
  if (!getJsonPackage(jsonPackagePath)) {
    return console.error('[add-storybook] Could not find package.json file. Exiting...');
  }

  const sm = getSmFile();
  const localLibs = (await Promise.all(sm.libraries.map(Libraries.infos))).filter(({ isLocal }) => isLocal);

  const storiesMatch = localLibs.map(lib => path.posix.join('..', lib.relativePathToLib, `/**/*.stories.${manifest.storyExtension}`));
  const storybookTemplatePath = path.normalize(path.join(__dirname, '../storybook-templates', framework));

  const pkgManager = Dependencies.detectPackageManager();
  installDependencies(manifest, pkgManager);

  await copy(
    storybookTemplatePath,
    userStorybookPath, {
      main: 'main',
      storiesMatch: storiesMatch.map(f => `"${f}"`).join(','),
    },
  );

  const jsonPackage = getJsonPackage(jsonPackagePath);
  const updatedPackage = {
    ...jsonPackage,
    scripts: {
      ...jsonPackage.scripts,
      ...manifest.scripts,
    },
  };

  console.log(`[add-storybook] Storybook added at path "${userStorybookPath}"`);

  writeFileAsJson(jsonPackagePath, updatedPackage);
  console.log('[add-storybook] Storybook commands added to package.json file');

  shell.exec(`${pkgManager.cmd} run ${manifest.command}`);
}
