const path = require('path');
const os = require('os');

export const PRISMIC_BIN = require.resolve('../../bin/prismic');

export const CONFIG_PATH = path.resolve(os.homedir(), '.prismic');

export const TMP_DIR = path.resolve('__tmp__');

export const RETRY_TIMES = 5;