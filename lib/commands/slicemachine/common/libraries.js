import fs from 'fs';
import path from 'path';
import slash from 'slash';
import { snakelize } from 'sm-commons/utils/str';
import globby from 'globby';

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

function _sliceModel(libPath, slicePath) {
  if (!slicePath || slicePath.length === 0) return null;

  const sliceName = slicePath
    .replace('/model.json', '')
    .split('/')
    .pop();

  if (!sliceName) return null;

  const id = snakelize(sliceName);
  const model = require(slicePath);

  return {
    [sliceName]: {
      id, lib: libPath, path: slicePath, model,
    },
  };
}

async function slicesModels(libPath) {
  try {
    const { pathToSlices } = infos(libPath);

    const models = await (async () => {
      const paths = await globby([
        `${pathToSlices}/**/model.json`,
      ]);
      return paths.reduce((acc, p) => ({ ...acc, ..._sliceModel(libPath, p) }), {});
    })();

    return models;
  } catch (e) {
    console.error(e);
  }
}

export default {
  infos,
  slicesModels,
};
