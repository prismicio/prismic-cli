import fs from 'fs';
import path from 'path';

const SM_CONFIG_FILE = 'sm.config.json';

function fromPath(libPath) {
  const isLocal = ['@/', '~', '/'].find(e => libPath.indexOf(e) === 0) !== undefined;
  const pathToLib = path.join(
    process.cwd(),
    isLocal ? '' : 'node_modules',
    isLocal ? libPath.substring(1, libPath.length) : libPath,
  );
  const pathToConfig = path.join(pathToLib, SM_CONFIG_FILE);

  let config = {};
  if (fs.existsSync(pathToConfig)) {
    config = JSON.parse(fs.readFileSync(pathToConfig));
  }
  const pathToSlices = path.join(
    pathToLib,
    config.pathToLibrary || '.',
    config.slicesFolder || (isLocal ? '.' : 'slices'),
  );
  return {
    config,
    isLocal,
    pathToLib,
    pathToSlices,
  };
}

export { fromPath };
