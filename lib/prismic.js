#!/usr/bin/env node
import Commands from './commands/index';
import commandLineCommands from 'command-line-commands';
// TODO:
// - specific runtime instructions from the template, directly on prompt?


try {
  const input = commandLineCommands(Commands.cliValidCommands());
  const { command, argv: args } = input;
  Commands.run(command, args);
} catch (ex) {
  Commands.run('help');
}
