import path from 'path';
import shell from 'shelljs';
import { existsSync } from 'fs';

import PackageManagers from './package-managers';

export default {
  install(cmd, deps) {
    if (deps && Array.isArray(deps)) {
      shell.exec(`${cmd} ${deps.join(' ')}`);
    }
  },

  detectPackageManager() {
    existsSync(path.join(process.cwd(), 'yarn.lock'))
      ? PackageManagers.yarn
      : PackageManagers.npm;
  },
};
