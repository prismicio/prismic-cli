import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import consola from 'consola';
import deepmerge from 'deepmerge';
import globals from '../../../globals';

function getFilePath() {
  const startPath = process.cwd();
  const pathToSmFile = path.join(startPath, globals.DEFAULT_SM_CONFIG_PATH);
  const exists = shell.test('-e', pathToSmFile);
  return {
    pathToSmFile,
    exists,
  };
}

function get() {
  const { pathToSmFile, exists } = getFilePath();
  if (!exists) return null;

  try {
    const sm = JSON.parse(fs.readFileSync(pathToSmFile));
    return sm;
  } catch (e) {
    return null;
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

function getOrFail() {
  const smConfig = get();
  validate(smConfig);
  return smConfig;
}

function write(data) {
  try {
    const { pathToSmFile } = getFilePath();
    return fs.writeFileSync(pathToSmFile, JSON.stringify(data), 'utf8');
  } catch (e) {
    return consola.error(`Could not write "${globals.DEFAULT_SM_CONFIG_PATH}" file`);
  }
}

function patch(data, invert = false) {
  try {
    const sm = get();
    const args = invert ? [data, sm] : [sm, data];
    const merge = deepmerge(...args);
    return write(merge);
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
