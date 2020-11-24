import path from 'path';
import shell from 'shelljs';
import { Files } from '../utils';
import PackageManagers from './package-managers';

export default {
  install(cmd, deps) {
    if (deps && Array.isArray(deps)) {
      shell.exec(`${cmd} ${deps.join(' ')}`);
    }
  },

  detectPackageManager() {
    return Files.exists(path.join(process.cwd(), 'yarn.lock'))
      ? PackageManagers.yarn
      : PackageManagers.npm;
  },
};
