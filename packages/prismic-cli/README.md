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
$ prismic [command]
running command...
$ prismic (-v|--version|version)
prismic-cli/4.1.1 darwin-arm64 node-v16.6.1
$ prismic --help [command]
USAGE
  $ prismic [command]
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prismic help [command]`](#prismic-help-command)
* [`prismic list`](#prismic-list)
* [`prismic login`](#prismic-login)
* [`prismic logout`](#prismic-logout)
* [`prismic new`](#prismic-new)
* [`prismic signup`](#prismic-signup)
* [`prismic slicemachine`](#prismic-slicemachine)
* [`prismic theme [SOURCE]`](#prismic-theme-source)
* [`prismic whoami`](#prismic-whoami)

## `prismic help [command]`

Show the available command options.

```
USAGE
  $ prismic help [command]

ARGUMENTS
  [command]  Command to show help for.

OPTIONS
  --all  see all commands in CLI
```

## `prismic list`

List all the available project template generators.

```
USAGE
  $ prismic list

OPTIONS
  -h, --help Show the available command options.
```

_See code: [src/commands/list.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/list.ts)_

## `prismic signup`

Create a new Prismic account.

```
USAGE
  $ prismic signup

OPTIONS
  -h, --help     Show the available command options.
  --port [port]  Port to start the local login server. Default: [5555]
```

_See code: [src/commands/signup.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/signup.ts)_

## `prismic login`

Log in to Prismic.

```
USAGE
  $ prismic login

OPTIONS
  -h, --help          Show the available command options.
  --port [port-name]  Port to start the local login server. Default: [5555]
```

_See code: [src/commands/login.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/login.ts)_

## `prismic logout`

Log out of Prismic.

```
USAGE
  $ prismic logout

OPTIONS
  -h, --help  Show the available command options.
```

_See code: [src/commands/logout.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/logout.ts)_

## `prismic new`

Create a project with a new Prismic repository.

```
USAGE
  $ prismic new

OPTIONS
  -h, --help                     Show the available command options.
  -d, --domain [repo-name]       Create a new Prismic repository. For example, your-repo-name creates the URL https://your-repo-name.prismic.io.
  -f, --folder [folder-name]     Name a new local project folder. Use it to create a new Prismic repository and select a technology.
  -t, --template [template-url]  Install a project from a Prismic template.
  --force                        Over write local files.
  --skip-install                 Prevent running install command after generating project.
```

_See code: [src/commands/new.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/new.ts)_

## `prismic slicemachine`

Slice Machine commands.

```
USAGE
  $ prismic slicemachine

OPTIONS
  -h, --help                Show the available command options.
  -d, --domain [repo-name]  Create a new Prismic repository. For example, your-repo-name creates the URL https://your-repo-name.prismic.io.
  -f, --force               Overwrite local files.
  --add-storybook           Install Storybook at the root of your Slice Machine project. It will configure it automatically to display your local Slices.
  --bootstrap               Bootstrap a project with Slice Machine from an existing configuration.
  --create-slice            Create a new Slice component in your file system and a corresponding Slice in your Prismic repository.
  --develop                 Launch the Slice Builder locally. Storybook must already be running.
  --folder [folder-name]    Name a new local project folder. Use it to create a new Prismic repository and select a technology.
  --framework [next||nuxt]  Select any of the supported frameworks (Nuxt.js and Next.js as of January, 2021).
  --library [library]       The name of the Slice Library.
  --list                    List all the Slices from libraries and the local files. 
  --setup                   Set up a Slice Machine environment in an already existing project. In the root folder of a supported framework (Nuxt.js and Next.js as of January, 2021), it will add dependencies for Slice Machine and the Slice Builder. Then, it creates a repo in Prismic.
  --skip-install            Prevent running install command after generating project.
  --sliceName [slice-name]  The name of the Slice in the library.

ALIASES
  $ prismic sm
```

_See code: [src/commands/slicemachine.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/slicemachine.ts)_

## `prismic theme [source]`

Create a project from a zip file or GitHub repository and a new Prismic repository. Add a [theme-url], a path, or URL to a zip file or a GitHub Repository.

```
USAGE
  $ prismic theme [theme-url]

ARGUMENTS
  [theme-url]  Path to a zip file or a GitHub repository.

OPTIONS
  -h, --help                      Show the available command options.
  -c, --conf [configuration-path] Path to prismic configuration file. Default: prismic-configuration.js.
  -d, --domain [domain]           Create a new Prismic repository. For example, your-repo-name creates the URL https://your-repo-name.prismic.io.
  -f, --folder [folder]           Name a new local project folder. Use it to create a new Prismic repository and select a technology.
  -t, --theme-url [theme-url]     Url or path to the theme
  --customTypes [custom-types]    Path to the custom types directory in the project. Default: custom_types.
  --force                         Overwrite local files.
  --skip-install                  Prevent running install command after generating project.
```

_See code: [src/commands/theme.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/theme.ts)_

## `prismic whoami`

Shows the email of the current user.

```
USAGE
  $ prismic whoami

OPTIONS
  -h, --help  Show the available command options.
```

_See code: [src/commands/whoami.ts](https://github.com/prismicio/prismic-cli/blob/master/packages/prismic-cli/src/commands/whoami.ts)_
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
