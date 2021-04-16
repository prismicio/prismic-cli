#!/usr/bin/env node
import commandLineCommands from 'command-line-commands';
import { cliValidCommands, run } from './commands/index';
import Sentry from './services/sentry';
import Helpers from './helpers';
import {checkVersion} from './commands/version'

(async () => {
  try {
    const input = commandLineCommands(cliValidCommands());
    const { command, argv: args } = input;
    if (args.includes('--version') === false) { await checkVersion().catch(() => true); }
    await run(command, args);
  } catch (ex) {
    if (ex.name === 'INVALID_COMMAND') {
      console.error('Invalid command');
      run();
    } else {
      Sentry.init();
      Helpers.UI.display('Something (really) wrong happened. If the problem persists, feel free to contact us!');
      console.error(`[Full error] ${ex}`);

      Sentry.report(ex);
      Sentry.close(2000, () => {
        process.exit();
      });
    }
  }
})();
