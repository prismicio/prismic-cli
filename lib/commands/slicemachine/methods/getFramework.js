import shell from 'shelljs';
import fetch from 'node-fetch';
import consola from 'consola';
import ora from 'ora';
import urljoin from 'url-join';

const testProject = (tests, projectPath = './') =>
  tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === true);

export default async function ({ apiEndpoint, framework }, displayInfo = true) {
  let spinner;
  if (displayInfo) {
    spinner = ora('Downloading framework definitions').start();
  }
  const endpoint = urljoin(apiEndpoint, 'frameworks');
  const res = await fetch(endpoint);
  if (displayInfo) {
    spinner.succeed();
  }
  if (res.status !== 200) {
    consola.error(`[SliceMachine/handleFrameworks] Unable to fetch manifests. Error code: ${res.status}`);
    return new Error();
  }
  const frameworks = await res.json();
  const testsByFramework = frameworks.reduce((acc, {
    framework: currentFmwk,
    manifest,
  }) => ({
    ...acc,
    [currentFmwk]: manifest.projectTests,
  }), {});

  const frmwk = Object.entries(testsByFramework)
    .reduce((acc, [currentFmwk, tests]) => acc || (testProject(tests) ? currentFmwk : null), null);


  if (!frmwk) {
    consola.error('Init should be launched inside a Next/Nuxt app');
    consola.info('Did you run this command from the right folder?');
    return new Error();
  }
  return frmwk;
}
