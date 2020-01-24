#!/usr/bin/env node
import commandLineCommands from 'command-line-commands';
import { cliValidCommands, run } from './commands/index';
import Sentry from './services/sentry';
import Helpers from './helpers';

(async () => {
  Sentry.init();
  try {
    const input = commandLineCommands(cliValidCommands());
    const { command, argv: args } = input;
    await run(command, args);
  } catch (ex) {
    Sentry.report(ex);
    Helpers.UI.display('Something (really) wrong happened. If the problem persists, feel free to contact us!');
    Sentry.close(2000, () => {
      process.exit();
    });
  }
})();
