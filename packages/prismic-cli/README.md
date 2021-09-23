prismic-cli
===========

Command line tool to bootstrap Prismic projects.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prismic-cli.svg)](https://npmjs.org/package/prismic-cli)
[![Downloads/week](https://img.shields.io/npm/dw/prismic-cli.svg)](https://npmjs.org/package/prismic-cli)
[![License](https://img.shields.io/npm/l/prismic-cli.svg)](https://github.com/prismicio/prismic-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
* [Development](#development)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g prismic-cli
$ prismic COMMAND
running command...
$ prismic (-v|--version|version)
prismic-cli/4.2.0 darwin-x64 node-v16.9.1
$ prismic --help [COMMAND]
USAGE
  $ prismic COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prismic help [COMMAND]`](#prismic-help-command)
* [`prismic list`](#prismic-list)
* [`prismic login`](#prismic-login)
* [`prismic logout`](#prismic-logout)
* [`prismic new`](#prismic-new)
* [`prismic signup`](#prismic-signup)
* [`prismic slicemachine`](#prismic-slicemachine)
* [`prismic theme [SOURCE]`](#prismic-theme-source)
* [`prismic whoami`](#prismic-whoami)

## `prismic help [COMMAND]`

display help for prismic

```
USAGE
  $ prismic help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `prismic list`

List all the available project template generators.

```
USAGE
  $ prismic list

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/list.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/list.ts)_

## `prismic login`

Log in to Prismic.

```
USAGE
  $ prismic login

OPTIONS
  -h, --help   show CLI help
  --port=port  [default: 5555] Port to start the local login server.
```

_See code: [src/commands/login.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/login.ts)_

## `prismic logout`

Log out of Prismic.

```
USAGE
  $ prismic logout

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/logout.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/logout.ts)_

## `prismic new`

Create a project with a new Prismic repository.

```
USAGE
  $ prismic new

OPTIONS
  -d, --domain=domain      Name of the Prismic repository. For example: repo-name, becomes https://repo-name.prismic.io.
  -f, --folder=folder      Name of the project folder.
  -h, --help               show CLI help
  -t, --template=template  Prismic template for the project.
  --existing-repo          Connect to an existing Prismic repository.
  --force                  Overwrite local files.
  --skip-install           Prevent running install command after generating project.
```

_See code: [src/commands/new.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/new.ts)_

## `prismic signup`

Create a Prismic account.

```
USAGE
  $ prismic signup

OPTIONS
  -h, --help   show CLI help
  --port=port  [default: 5555] Port to start the local login server.
```

_See code: [src/commands/signup.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/signup.ts)_

## `prismic slicemachine`

Slice Machine commands

```
USAGE
  $ prismic slicemachine

OPTIONS
  -d, --domain=domain    Prismic repo to create.
  -f, --folder=folder    Output directory.
  -h, --help             show CLI help
  --add-storybook        Add Storybook to a Slice Machine project.
  --bootstrap            Reconfigure a Slice Machine project.
  --create-slice         Add a Slice to a Slice Machine project.
  --develop              Run Slice Machine.
  --existing-repo        Connect to an existing Prismic repository when running --setup or --bootstrap
  --force                Overwrite local files.
  --framework=framework  framework to use, see list for options
  --library=library      Name of the Slice library.
  --list                 List local Slices.
  --setup                Setup Slice Machine in an already existing project.
  --skip-install         Prevent npm install from running.
  --sliceName=sliceName  Name of the Slice.

ALIASES
  $ prismic sm
```

_See code: [src/commands/slicemachine.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/slicemachine.ts)_

## `prismic theme [SOURCE]`

Create a project from a ZIP file or a GitHub repository URL and a new Prismic repository.

```
USAGE
  $ prismic theme [SOURCE]

ARGUMENTS
  SOURCE  Path or URL to a ZIP file, or a GitHub repository for the theme.

OPTIONS
  -c, --conf=conf            [default: prismic-configuration.js] Path to Prismic configuration file.

  -d, --domain=domain        Name of the new Prismic repository. For example, repo-name becomes
                             https://repo-name.prismic.io.

  -f, --folder=folder        Name of the project folder.

  -h, --help                 show CLI help

  -t, --theme-url=theme-url  GitHub URL or path to the theme file.

  --customTypes=customTypes  [default: custom_types] Path to the Custom Types directory in the theme.

  --documents=documents      [default: documents] Path to the documents in the theme.

  --existing-repo            Connect to an existing Prismic repository.

  --force                    Overwrite local files.

  --skip-install             Prevent running install command after generating project.
```

_See code: [src/commands/theme.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/theme.ts)_

## `prismic whoami`

Shows the email of the current user.

```
USAGE
  $ prismic whoami

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/whoami.ts](https://github.com/prismicio/prismic-cli/blob/v4.2.0/src/commands/whoami.ts)_
<!-- commandsstop -->

# Development

## Running Locally
+ Clone this repository `git clone https://github.com/prismic.io/prismic-cli`
+ go to the root folder `cd prismic-cli`
+ install and/or link the dependencies with or `yarn` (uses workspaces)
+ Commands can be executed from the **packages/prismic-cli/bin/run** file i.e: `./bin/run --help`

## Testing
Run tests with `npm test` or `yarn test`
The main testing libary used is [@oclif/test](https://github.com/oclif/test) the documentation on how to use the testing library can be found here https://github.com/oclif/fancy-test.
Mocking/stubbing dependencies can be tricky due package versions for nested dependencies, and native modules being used else where.

## Linting
[eslint](https://eslint.org/) is automatically run after the `test` script, but it can also be invoked by running `npm run posttest` or `yarn posttest`, optionally with a `--fix` flag.

## Deployment
[lerna](https://lerna.js.org/) is used for managing versions and publishing.
update versions with `lerna version [semantic-version] --exact`
Publish with `lerna publish [--dist-tag alpha]`

## Built With
+ [Oclif](https://oclif.io/)
+ [Yeoman](https://yeoman.io/)
