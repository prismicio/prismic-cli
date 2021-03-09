prismic-cli
===========

Command line tool to bootstrap prismic projects.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prismic-cli.svg)](https://npmjs.org/package/prismic-cli)
[![Downloads/week](https://img.shields.io/npm/dw/prismic-cli.svg)](https://npmjs.org/package/prismic-cli)
[![License](https://img.shields.io/npm/l/prismic-cli.svg)](https://github.com/prismicio/prismic-cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g prismic-cli
$ prismic COMMAND
running command...
$ prismic (-v|--version|version)
prismic-cli/3.8.3 darwin-x64 node-v15.11.0
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
* [`prismic signup [FILE]`](#prismic-signup-file)
* [`prismic slicemachine`](#prismic-slicemachine)
* [`prismic theme [FILE]`](#prismic-theme-file)

## `prismic help [COMMAND]`

```
USAGE
  $ prismic help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `prismic list`

```
USAGE
  $ prismic list

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/list.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/list.ts)_

## `prismic login`

```
USAGE
  $ prismic login

OPTIONS
  -h, --help                           show CLI help
  --email=email                        email address
  --oauthaccesstoken=oauthaccesstoken  oauth access token for sso
  --password=password                  password
```

_See code: [src/commands/login.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/login.ts)_

## `prismic logout`

```
USAGE
  $ prismic logout

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/logout.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/logout.ts)_

## `prismic new`

```
USAGE
  $ prismic new

OPTIONS
  -d, --domain=domain      name of the prismic repository ie: example, becomes https://example.prismic.io
  -f, --folder=folder      name of project folder
  -h, --help               show CLI help
  -t, --template=template  Prismic template for the project
  --force                  over write local files
  --skip-install           prevent runing install command after generating project
```

_See code: [src/commands/new.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/new.ts)_

## `prismic signup [FILE]`

```
USAGE
  $ prismic signup [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/signup.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/signup.ts)_

## `prismic slicemachine`

```
USAGE
  $ prismic slicemachine

OPTIONS
  -d, --domain=domain    prismic repo to to create
  -f, --force
  -h, --help             show CLI help
  --add-storybook        add storybook to a slicemachine project
  --create-slice         add a slice to a slicemachine project
  --folder=folder        [default: /Users/marc/Projects/prismic/prismic-cli]
  --framework=next|nuxt
  --library=library      name of the slice library
  --list                 list local slices
  --setup                setup slice machine in an already existing project
  --skip-install         prevent npm install from running
  --sliceName=sliceName  name of the slice
```

_See code: [src/commands/slicemachine.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/slicemachine.ts)_

## `prismic theme [FILE]`

```
USAGE
  $ prismic theme [FILE]

OPTIONS
  -d, --domain=domain        name of the prismic repository ie: example, becomes https://example.prismic.io
  -f, --folder=folder        name of project folder
  -h, --help                 show CLI help
  -t, --themeUrl=themeUrl    Url or path to the theme
  --config=config            [default: prismic-configuration.js] path to prismic configuration file
  --customTypes=customTypes  [default: custom_types] path to custom types directory in the theme
  --documents=documents      [default: documents] path to documents in the theme
  --force                    over-write local files
```

_See code: [src/commands/theme.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/theme.ts)_
<!-- commandsstop -->
