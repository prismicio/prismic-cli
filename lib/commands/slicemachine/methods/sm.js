import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import consola from 'consola';
import deepmerge from 'deepmerge';
import globals from '../../../globals';

function getFilePath(p) {
  const startPath = p || process.cwd();
  const pathToSmFile = path.join(startPath, globals.DEFAULT_SM_CONFIG_PATH);
  const exists = shell.test('-e', pathToSmFile);
  return {
    pathToSmFile,
    exists,
  };
}

function get(p) {
  const { pathToSmFile, exists } = getFilePath(p);
  if (!exists) {
    return consola.error('Could not find sm file');
  }
  try {
    const sm = JSON.parse(fs.readFileSync(pathToSmFile));
    return sm;
  } catch (e) {
    consola.error(`Could not parse "${globals.DEFAULT_SM_CONFIG_PATH}" file`);
    return {};
  }
}

function validate(smConfig) {
  if (!smConfig) {
    throw new Error('sm file not found.\nExiting...');
  }
  if (!smConfig.libraries) {
    throw new Error('sm file should have a "libraries" field, filled with paths to SM libs');
  }
  if (!smConfig.libraries.length || !Array.isArray(smConfig.libraries)) {
    throw new Error('empty or malformed "libraries" field');
  }
}

function getOrFail(p) {
  const smConfig = get(p);
  validate(smConfig);
  return smConfig;
}

function write(data, p) {
  try {
    const { pathToSmFile } = getFilePath(p);
    return fs.writeFileSync(pathToSmFile, JSON.stringify(data));
  } catch (e) {
    return consola.error(`Could not write "${globals.DEFAULT_SM_CONFIG_PATH}" file`);
  }
}

function patch(data, invert = false, p) {
  try {
    const sm = get(p);
    const args = invert ? [data, sm] : [sm, data];
    const merge = deepmerge(...args);
    return write(merge, p);
  } catch (e) {
    return consola.error(`Could not patch "${globals.DEFAULT_SM_CONFIG_PATH}" file`);
  }
}

export {
  get,
  getOrFail,
  validate,
  write,
  patch,
};
