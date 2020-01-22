#!/usr/bin/env node
import commandLineCommands from 'command-line-commands';
import { cliValidCommands, run } from './commands/index';
import Sentry from './services/sentry';
import Helpers from './helpers';

(async () => {
  Sentry.init();
  try {
    throw new Error('test@2');
    const input = commandLineCommands(cliValidCommands());
    const { command, argv: args } = input;
    await run(command, args);
  } catch (ex) {
    Sentry.report(ex, 'cli-global-error');
    Helpers.UI.display('Oops, something wrong happened');
    Sentry.await(() => process.exit(1));
  }
})();
