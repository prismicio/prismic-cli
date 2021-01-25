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
prismic-cli/3.8.3 darwin-x64 node-v15.5.1
$ prismic --help [COMMAND]
USAGE
  $ prismic COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`prismic help [COMMAND]`](#prismic-help-command)
* [`prismic login`](#prismic-login)
* [`prismic logout`](#prismic-logout)
* [`prismic new [NO-INSTALL]`](#prismic-new-no-install)
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

## `prismic new [NO-INSTALL]`

```
USAGE
  $ prismic new [NO-INSTALL]

ARGUMENTS
  NO-INSTALL  skip running npm install

OPTIONS
  -d, --domain=domain      name of the prismic repository ie: example, becomes https://example.prismic.io
  -f, --folder=folder      name of project folder
  -h, --help               show CLI help
  -t, --template=template  Prismic template for the project
  --force
```

_See code: [src/commands/new.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/new.ts)_

## `prismic theme [FILE]`

```
USAGE
  $ prismic theme [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src/commands/theme.ts](https://github.com/prismicio/prismic-cli/blob/v3.8.3/src/commands/theme.ts)_
<!-- commandsstop -->
