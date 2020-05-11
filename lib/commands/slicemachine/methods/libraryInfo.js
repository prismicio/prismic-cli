import fs from 'fs';
import path from 'path';
import slash from 'slash';

const SM_CONFIG_FILE = 'sm.config.json';

function fromPath(libPath) {
  const isLocal = ['@/', '~', '/'].find(e => libPath.indexOf(e) === 0) !== undefined;
  const pathToLib = path.posix.join(
    // slash convert backslash from Windows Paths to forward slash
    slash(process.cwd()),
    isLocal ? '' : 'node_modules',
    isLocal ? libPath.substring(1, libPath.length) : libPath,
  );

  const pathToConfig = path.posix.join(pathToLib, SM_CONFIG_FILE);

  const config = (() => {
    if (fs.existsSync(pathToConfig)) return JSON.parse(fs.readFileSync(pathToConfig));
    return {};
  })();

  // path.posix allow us to build a url with forward slash, mandatory to scan the file system afterwards to find slices
  const pathToSlices = path.posix.join(
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

export default fromPath;
