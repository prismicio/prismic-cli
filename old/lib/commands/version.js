import fetch from 'node-fetch';
import semver from 'semver';

import Helpers from '../helpers';
import currentPackage from '../../package.json';

export default function showVersion() {
  Helpers.UI.display(currentPackage.version);
}

const NAME = currentPackage.name;

export function fetchRemotePackage(packageName = NAME) {
  /*
   * Docs about npm's api
   * https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
   */
  return fetch(`https://registry.npmjs.org/${packageName}`, {
    headers: { Accept: 'application/vnd.npm.install-v1+json' },
  }).then((res) => res.json()).catch((err) => {
    console.error(`Failed to fetch ${packageName}`);
    console.error(err);
  });
}

/*
* @local package.json
* @remote package.json // slightly different shape
*/
export function isSameVersionOrHigher(local, remote) {
  const highestStableRemoteVersion = Object.keys(remote.versions)
    .filter((version) => (semver.valid(semver.coerce(version)) === version))
    .reduce((acc, curr) => (semver.gte(acc, curr) ? acc : curr), '0.0.0');

  return semver.gte(local.version, highestStableRemoteVersion);
}

export async function checkVersion() {
  const remotePackage = await fetchRemotePackage(currentPackage.name);
  const isUptoDate = isSameVersionOrHigher(currentPackage, remotePackage);

  if (isUptoDate === false) {
    console.warn(`A new version of ${NAME} is available!`);
    console.info(`Upadte now by runing "npm install -g ${NAME}"`);
  }

  return isUptoDate;
}
