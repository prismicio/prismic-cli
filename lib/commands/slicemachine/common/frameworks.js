import fetch from 'node-fetch';
import consola from 'consola';
import shell from 'shelljs';

import ora from 'ora';
import urljoin from 'url-join';
import { ctx } from '../../../context';

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === true);

export const fetchFrameworks = async () => {
  const endpoint = urljoin(ctx.SliceMachine.apiEndpoint, 'frameworks');
  return fetch(endpoint);
};

export const determineFrameworkUsed = async (DEBUG = false) => {
  const spinner = ora('Downloading framework definitions').start();
  const res = await fetchFrameworks();
  spinner.succeed();
  if (res.status !== 200) {
    throw new Error(`[getFramework/fetch] Unable to fetch frameworks. Error code: ${res.status}`);
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
    throw new Error('SliceMachine should be launched inside a Next/Nuxt app.\nDid you run this command from the right folder?');
  }
  if (DEBUG) {
    return 'nuxt';
  }
  return frmwk;
};
