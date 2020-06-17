import shell from 'shelljs';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import cpy from 'copy-template-dir';
import slash from 'slash';
import { promisify } from 'util';

import { ctx } from '../../../context';
import Libraries from '../common/libraries';


import { getOrFail as getSmFile } from '../methods/sm';

const copy = promisify(cpy);

const Framework = {
  next: {
    devDependencies: ['@storybook/react', 'babel-loader'],
    extension: '[tj]s',
    scripts: {
      storybook: 'start-storybook -p 6006',
      'build-storybook': 'build-storybook',
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
    installCmd: 'npm i --save',
    installDevCmd: 'npm i --save-dev',
  },
};

function execInstall(cmd, deps) {
  if (deps && Array.isArray(deps)) {
    shell.exec(`${cmd} ${deps.join(' ')}`);
  }
}

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
  if (!existsSync(filePath)) {
    return null;
  }

  writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`);
  return true;
}

function getJsonPackage(jsonPackagePath) {
  if (!existsSync(jsonPackagePath)) {
    return null;
  }

  const jsonContent = readFileSync(jsonPackagePath, 'utf8');
  return JSON.parse(jsonContent);
}


/* eslint-disable  consistent-return */
export default async function () {
  const { framework } = ctx.SliceMachine;
  const manifest = Framework[framework];
  if (!manifest) {
    return console.log(`[add-storybook] Framework "${framework}" is not currently supported. Exiting...`);
  }

  const userStorybookPath = slash(path.posix.join(process.cwd(), '.storybook'));
  if (existsSync(userStorybookPath)) {
    return console.log('[add-storybook] Storybook is already installed. Exiting...');
  }

  const jsonPackagePath = path.posix.join(slash(process.cwd()), 'package.json');
  const jsonPackage = getJsonPackage(jsonPackagePath);
  if (!jsonPackage) {
    return console.error('[add-storybook] Could not find package.json file. Exiting...');
  }

  const sm = getSmFile();
  const localLibs = (await Promise.all(sm.libraries.map(Libraries.infos))).filter(({ isLocal }) => isLocal);

  const storiesMatch = localLibs.map(lib => path.posix.join('..', lib.relativePathToLib, `/**/*.stories.${manifest.extension}`));
  const storybookTemplatePath = path.normalize(path.join(__dirname, '../storybook-templates', framework));

  const packageManager =
    existsSync(slash(path.posix.join(process.cwd(), 'yarn.lock'))) ? PackageManager.yarn : PackageManager.npm;

  handleDependencies(manifest, packageManager);

  console.log(storybookTemplatePath);
  await copy(
    storybookTemplatePath,
    userStorybookPath, {
      main: 'main',
      storiesMatch: storiesMatch.map(f => `"${f}"`).join(','),
    },
  );

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

  shell.exec(`${packageManager.cmd} run ${manifest.command}`);
}
