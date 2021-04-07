import fetch from 'node-fetch';
import semver from 'semver';
import libnpmconfig from 'libnpmconfig';

import Helpers from '../helpers';
import currentPackage from '../../package.json';


export default function showVersion() {
  Helpers.UI.display(currentPackage.version);
}

const NAME = currentPackage.name;

export function fetchRemotePackage(packageName = NAME) {
  const config = libnpmconfig.read({ registry: 'https://registry.npmjs.org/' });

  const addr = new URL(config.registry);
  addr.pathname = packageName;
  /*
   * Docs about npm's api
   * https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
   */
  return fetch(addr.toString(), {
    headers: { Accept: 'application/vnd.npm.install-v1+json' },
  }).then((res) => res.json()).catch((err) => {
    console.error(`Failed to fetch ${packageName} from ${config.registry}`);
    throw err;
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
  return fetchRemotePackage(currentPackage.name)
    .then((remotePackage) => isSameVersionOrHigher(currentPackage, remotePackage))
    .then((isUpToDate) => {
      if (isUpToDate === false) {
        console.warn(`A new version of ${NAME} is available!`);
        console.info(`Update now by running "npm install -g ${NAME}"`);
      }
      return isUpToDate;
    })
    .catch(() => true);
}
