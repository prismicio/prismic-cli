import fetch from 'node-fetch';
import consola from 'consola';
import shell from 'shelljs';

import ora from 'ora';
import urljoin from 'url-join';
import { ctx } from '../../../context';

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === true);

export const fetchFrameworks = async (DEBUG = false) => {
  const endpoint = urljoin(ctx.SliceMachine.apiEndpoint, 'frameworks');
  return await fetch(endpoint);
}

export const determineFrameworkUsed = async (DEBUG = false) => {
  const spinner = ora('Downloading framework definitions').start();
  const res = await fetchFrameworks();
  spinner.succeed();
  if (res.status !== 200) {
    consola.error(`[getFramework/fetch] Unable to fetch frameworks. Error code: ${res.status}`);
    return [new Error(), null];
  }
  const frameworks = await res.json();
  const testsByFramework = frameworks
    .reduce((acc, { framework: currentFmwk, manifest }) => ({
    ...acc,
    [currentFmwk]: manifest.projectTests,
  }), {});

  const frmwk = Object.entries(testsByFramework)
    .reduce((acc, [currentFmwk, tests]) => acc || (testProject(tests) ? currentFmwk : null), null);

  if (!frmwk && !DEBUG) {
    consola.error('SliceMachine should be launched inside a Next/Nuxt app');
    consola.info('Did you run this command from the right folder?');
    return [new Error(), null];
  }
  if (DEBUG) {
    return [null, 'nuxt'];
  }
  return [null, frmwk];
}
