#!/usr/bin/env node
import Commands, { help } from './commands';
import commandLineCommands from 'command-line-commands';
// TODO:
// - specific runtime instructions from the template, directly on prompt?


try {
  const input = commandLineCommands(Commands.cliValidCommands());
  const { command, argv: args } = input;
  const ctx = Context.build(command, args);

  Commands.run(command, ctx);
} catch (ex) {
  console.log(ex.message);
  help();
}
