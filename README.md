# prismic-cli

Command line to bootstrap prismic projects.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prismic-cli.svg)](https://npmjs.org/package/prismic-cli)
[![Downloads/week](https://img.shields.io/npm/dw/prismic-cli.svg)](https://npmjs.org/package/prismic-cli)
[![License](https://img.shields.io/npm/l/prismic-cli.svg)](https://github.com/prismicio/prismic-cli/blob/master/package.json)

<!-- toc -->
* [prismic-cli](#prismic-cli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g prismic-cli
$ prismic-cli COMMAND
running command...
$ prismic-cli (-v|--version|version)
prismic-cli/3.6.2 darwin-x64 node-v13.0.1
$ prismic-cli --help [COMMAND]
USAGE
  $ prismic-cli COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`prismic-cli autocomplete [SHELL]`](#prismic-cli-autocomplete-shell)
* [`prismic-cli help [COMMAND]`](#prismic-cli-help-command)
* [`prismic-cli init [NAME]`](#prismic-cli-init-name)
* [`prismic-cli list`](#prismic-cli-list)
* [`prismic-cli new [NAME]`](#prismic-cli-new-name)
* [`prismic-cli signin`](#prismic-cli-signin)
* [`prismic-cli signout`](#prismic-cli-signout)
* [`prismic-cli signup`](#prismic-cli-signup)

## `prismic-cli autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ prismic-cli autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ prismic-cli autocomplete
  $ prismic-cli autocomplete bash
  $ prismic-cli autocomplete zsh
  $ prismic-cli autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.4/src/commands/autocomplete/index.ts)_

## `prismic-cli help [COMMAND]`

display help for prismic-cli

```
USAGE
  $ prismic-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `prismic-cli init [NAME]`

Initialize the code from a template for an existing prismic repository

```
USAGE
  $ prismic-cli init [NAME]

ARGUMENTS
  NAME  The name of the existing prismic repository

OPTIONS
  -C, --cache                Use a cached version of the project
  -P, --skip-prompt          Skip the prompt
  -a, --token=token          Set the access token
  -c, --config=config        [default: prismic.config.js] Set the configuration path
  -d, --directory=directory  Set the project directory to create
  -t, --template=template    Set the template name to use

ALIASES
  $ prismic-cli initialize

EXAMPLES
  $ prismic-cli init
  $ prismic-cli init foobar
  $ prismic-cli init foobar --directory foobar --template nodejs
```

_See code: [src/commands/init.ts](https://github.com/prismicio/prismic-cli/blob/v3.6.2/src/commands/init.ts)_

## `prismic-cli list`

List the available code templates

```
USAGE
  $ prismic-cli list

ALIASES
  $ prismic-cli ls

EXAMPLES
  $ prismic-cli list
  $ prismic-cli ls
```

_See code: [src/commands/list.ts](https://github.com/prismicio/prismic-cli/blob/v3.6.2/src/commands/list.ts)_

## `prismic-cli new [NAME]`

Create a new project and a prismic repository

```
USAGE
  $ prismic-cli new [NAME]

OPTIONS
  -C, --cache                Use a cached version of the project
  -P, --skip-prompt          Skip the prompt
  -X, --skip-config          Skip the configuration file
  -a, --token=token          Set the access token
  -c, --config=config        [default: prismic.config.js] Set the configuration path
  -d, --directory=directory  Set the project directory to create
  -e, --theme=theme          Set the theme's url
  -q, --quickstart           Set up a Node.js project with a new prismic repository
  -t, --template=template    Set the template name to use
  -u, --users=users          Set the users

EXAMPLES
  $ prismic-cli new foobar
  $ prismic-cli new foobar --theme prismicio/nuxtjs-website
  $ prismic-cli new foobar --theme https://github.com/prismicio/nuxtjs-website
  $ prismic-cli new foobar --template nodejs
  $ prismic-cli new --quickstart
```

_See code: [src/commands/new.ts](https://github.com/prismicio/prismic-cli/blob/v3.6.2/src/commands/new.ts)_

## `prismic-cli signin`

Sign into an existing prismic.io account

```
USAGE
  $ prismic-cli signin

OPTIONS
  -s, --status  Check the authentication status

ALIASES
  $ prismic-cli login

EXAMPLE
  $ prismic-cli signup
```

_See code: [src/commands/signin.ts](https://github.com/prismicio/prismic-cli/blob/v3.6.2/src/commands/signin.ts)_

## `prismic-cli signout`

Sign out from an existing prismic.io account

```
USAGE
  $ prismic-cli signout

OPTIONS
  -s, --status  Check the authentication status

ALIASES
  $ prismic-cli logout

EXAMPLES
  $ prismic-cli signout
  $ prismic-cli logout
```

_See code: [src/commands/signout.ts](https://github.com/prismicio/prismic-cli/blob/v3.6.2/src/commands/signout.ts)_

## `prismic-cli signup`

Create a new prismic.io account

```
USAGE
  $ prismic-cli signup

OPTIONS
  -s, --status  Check the authentication status

EXAMPLE
  $ prismic-cli signup
```

_See code: [src/commands/signup.ts](https://github.com/prismicio/prismic-cli/blob/v3.6.2/src/commands/signup.ts)_
<!-- commandsstop -->
