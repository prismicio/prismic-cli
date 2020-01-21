#!/usr/bin/env node
import commandLineCommands from 'command-line-commands';
import { cliValidCommands, run } from './commands/index';
// TODO:
// - specific runtime instructions from the template, directly on prompt?


(async () => {
  try {
    const input = commandLineCommands(cliValidCommands());
    const { command, argv: args } = input;
    await run(command, args);
  } catch (ex) {
    // await run('help');
    console.log(ex);
  } finally {
    process.exit(0);
  }
})();
