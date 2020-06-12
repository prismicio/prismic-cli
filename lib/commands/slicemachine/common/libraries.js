import fs from 'fs';
import path from 'path';
import slash from 'slash';
import globby from 'globby';
import isValidPath from 'is-valid-path';
import inquirer from 'inquirer';
import consola from 'consola';

import { getOrFail as getSmFile, patch as patchSmFile } from '../methods/sm';
import { Folders } from '../utils';
import Slice from '../models/slice';

const SM_CONFIG_FILE = 'sm.config.json';

function infos(libPath) {
  const isLocal = ['@/', '~', '/'].find(e => libPath.indexOf(e) === 0) !== undefined;
  const pathToLib = path.posix.join(
    // slash convert backslash from Windows Paths to forward slash
    slash(process.cwd()),
    isLocal ? '' : 'node_modules',
    isLocal ? libPath.substring(1, libPath.length) : libPath,
  );

  const pathToConfig = path.posix.join(pathToLib, SM_CONFIG_FILE);

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
  };
}

function buildSliceModel(libPath, isLocal, slicePath) {
  if (!slicePath || slicePath.length === 0) return null;
  return Slice.fromModelPath(slicePath, isLocal, libPath);
}

async function slicesModels(libPath) {
  try {
    const { pathToSlices, isLocal } = infos(libPath);

    const models = await (async () => {
      const paths = await globby([
        `${pathToSlices}/**/model.json`,
      ]);
      return paths.reduce((acc, p) => ({ ...acc, ...buildSliceModel(libPath, isLocal, p) }), {});
    })();

    return models;
  } catch (e) {
    console.error(e);
  }
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

export default {
  infos,
  slicesModels,
  buildSliceModel,
  selectLocal,
};
