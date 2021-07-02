import * as path from 'path'
import * as fs from 'fs'

import {supportedProjects, Framework, findProjectType} from './project-types'

export interface PkgJson {
  dependencies?: { [dependencyName: string]: string };
  peerDependencies?: { [dependencyName: string]: string };
  devDependencies?: { [dependencyName: string]: string };
}
const hasDependency = (packageJson: PkgJson, name: string) => Boolean(packageJson.dependencies && packageJson.dependencies[name]) || Boolean(packageJson.devDependencies && packageJson.devDependencies[name])

const hasPeerDependency = (packageJson: PkgJson, name: string) => Boolean(packageJson.peerDependencies && packageJson.peerDependencies[name])

const getFrameworkPreset = (
  packageJson: PkgJson,
  framework: Framework,
) /* ProjectType | null */ => {
  const matcher = {
    dependencies: [false],
    peerDependencies: [false],
    files: [false],
  }

  const {
    preset, files, dependencies, peerDependencies, matcherFunction,
  } = framework

  if (Array.isArray(dependencies) && dependencies.length > 0) {
    matcher.dependencies = dependencies.map(name => hasDependency(packageJson, name))
  }

  if (Array.isArray(peerDependencies) && peerDependencies.length > 0) {
    matcher.peerDependencies = peerDependencies.map(name => hasPeerDependency(packageJson, name))
  }

  if (Array.isArray(files) && files.length > 0) {
    matcher.files = files.map(name => fs.existsSync(path.join(process.cwd(), name)))
  }

  return matcherFunction(matcher) ? preset : null
}

export function detect(pkgJson: PkgJson) /* ProjectType */ {
  const result = supportedProjects.find((framework: Framework) => getFrameworkPreset(pkgJson, framework) !== null)

  return result ? result.preset : null
}

export const parse = findProjectType
