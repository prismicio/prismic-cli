import {Hook} from '@oclif/config'
import * as semver from 'semver'
import axios from 'axios'

const libnpmconfig = require('libnpmconfig')

interface DistTags {
  latest: string;
  [key: string]: string;
}

interface PackageMetaData {
  name: string;
  'dist-tags': DistTags;
  modified: string;
  versions: any; // package.json
}

const hook: Hook<'postrun'> = async function (opts) {
  const npmconfig = libnpmconfig.read()
  const registry: string = npmconfig.registry || 'https://registry.npmjs.org/'
  const {name, version} = opts.config.pjson

  const remoteVersionUrl = new URL(registry)
  remoteVersionUrl.pathname = name

  return axios.get<PackageMetaData>(remoteVersionUrl.toString(), {headers: {Accept: 'application/vnd.npm.install-v1+json'}})
  .then(res => res.data['dist-tags'].latest)
  .then(latest => {
    if (semver.lt(version, latest)) {
      // eslint-disable-next-line no-console
      console.info(`A new version of ${name} is available!`)
      // eslint-disable-next-line no-console
      console.info(`Update now by running "npm install -g ${name}"`)
    }
  })
  .catch(() => ({}))
}

export default hook
