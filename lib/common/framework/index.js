import path from 'path';
import fs from 'fs';

import { ProjectType, supportedProjects } from './project_types';
import { getBowerJson, getPackageJson } from './helpers';

const hasDependency = (packageJson, name) => !!(packageJson.dependencies && packageJson.dependencies[name]) || !!(packageJson.devDependencies && packageJson.devDependencies[name]);

const hasPeerDependency = (packageJson, name) => !!(packageJson.peerDependencies && packageJson.peerDependencies[name]);

const getFrameworkPreset = (
  packageJson,
  framework,
) /* ProjectType | null */ => {
  const matcher = {
    dependencies: [false],
    peerDependencies: [false],
    files: [false],
  };

  const {
    preset, files, dependencies, peerDependencies, matcherFunction,
  } = framework;

  if (Array.isArray(dependencies) && dependencies.length > 0) {
    matcher.dependencies = dependencies.map(name => hasDependency(packageJson, name));
  }

  if (Array.isArray(peerDependencies) && peerDependencies.length > 0) {
    matcher.peerDependencies = peerDependencies.map(name => hasPeerDependency(packageJson, name));
  }

  if (Array.isArray(files) && files.length > 0) {
    matcher.files = files.map(name => fs.existsSync(path.join(process.cwd(), name)));
  }

  return matcherFunction(matcher) ? preset : null;
};

function detectFrameworkPreset(packageJson = {}) {
  const result = supportedProjects.find(framework => getFrameworkPreset(packageJson, framework) !== null);

  return result ? result.preset : null;
}

export function detect() /* ProjectType */ {
  const packageJson = getPackageJson();
  const bowerJson = getBowerJson();

  if (!packageJson && !bowerJson) {
    return null;
  }

  return detectFrameworkPreset(packageJson || bowerJson);
}

export function parse(strFramework) {
  return Object.entries(ProjectType).find(([, value]) => value === strFramework.lowerCase());
}
