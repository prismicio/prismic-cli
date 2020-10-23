import fs from 'fs';
import path from 'path';
import slash from 'slash';
import globby from 'globby';
import isValidPath from 'is-valid-path';
import inquirer from 'inquirer';
import consola from 'consola';

import { getOrFail as getSmFile, patch as patchSmFile } from '../methods/sm';
import globals from '../../../globals';
import { Folders } from '../../../common/utils';
import Slice from '../models/slice';

const Prompts = {
  selectLocal(libs, NEW_LIB) {
    return inquirer.prompt([{
      type: 'list',
      name: 'lib',
      prefix: '🗂 ',
      message: 'Select your local lib',
      choices: libs.map(p => ({
        name: p,
        value: p,
      })).concat([{ name: 'New...', value: NEW_LIB }]),
    }]);
  },

  createLocal() {
    return inquirer.prompt([{
      type: 'input',
      name: 'newLib',
      default: 'slices',
      prefix: '🗂 ',
      message: 'Where should we create your new local library?',
      validate(input) {
        const isValid = isValidPath(path.join(process.cwd(), input));
        return isValid || 'Path is invalid';
      },
    }]);
  },
};

function infos(libPath) {
  const isLocal = ['@/', '~', '/'].find(e => libPath.indexOf(e) === 0) !== undefined;
  const relativePathToLib = path.posix.join(
    // slash convert backslash from Windows Paths to forward slash
    isLocal ? '' : 'node_modules',
    isLocal ? libPath.substring(1, libPath.length) : libPath,
  );

  const pathToLib = path.posix.join(slash(process.cwd()), relativePathToLib);

  const pathToConfig = path.posix.join(pathToLib, globals.DEFAULT_SM_CONFIG_PATH);

  const config = (() => {
    if (fs.existsSync(pathToConfig)) return JSON.parse(fs.readFileSync(pathToConfig));
    return {};
  })();

  // path.posix allow us to build a url with forward slash, mandatory to scan the file system afterwards to find slices
  const pathToSlices = path.posix.join(
    pathToLib,
    config.pathToLibrary || '.',
    config.slicesFolder || (isLocal ? '.' : 'slices'),
  );

  return {
    config,
    isLocal,
    pathToLib,
    pathToSlices,
    relativePathToLib,
  };
}

function buildSliceModel(lib, libPath, isLocal, slicePath) {
  if (!slicePath || slicePath.length === 0) return null;
  return Slice.fromModelPath(slicePath, isLocal, lib, libPath);
}

function slicesModels(lib) {
  const { pathToSlices, isLocal } = infos(lib);
  const paths = globby.sync([`${pathToSlices}/**/model.json`]);
  return paths.reduce((acc, p) => ({ ...acc, ...buildSliceModel(lib, /* libPath */ pathToSlices, isLocal, p) }), {});
}

function formatLibPath(libPath) {
  if (libPath.indexOf('@/') === 0) {
    return libPath;
  }
  if (libPath.indexOf('/') === 0) {
    return `@${libPath}`;
  }
  return `@/${libPath}`; 
}

async function createLocal() {
  const { newLib } = await Prompts.createLocal();
  const trimmed = newLib.trim();
  const formatted = formatLibPath(trimmed);
  Folders.mkdir(path.join(process.cwd(), trimmed));
  patchSmFile({ libraries: [formatted] }, true);
  return formatted;
}

async function selectLocal() {
  const NEW_LIB = '_new_';

  const sm = getSmFile();

  const localibs = sm.libraries.reduce((acc, libPath) => {
    const { isLocal } = infos(libPath);
    if (isLocal) {
      return [...acc, libPath];
    }
    return acc;
  }, []);

  if (!localibs) {
    consola.info('No local folder configured with SliceMachine');
    return createLocal();
  }

  const { lib } = await Prompts.selectLocal(localibs, NEW_LIB);
  if (lib === NEW_LIB) {
    return createLocal();
  }
  return lib;
}

export default {
  infos,
  slicesModels,
  buildSliceModel,
  selectLocal,
  formatLibPath,
};
