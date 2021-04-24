### I would not recommend using this module at all.

I will use it only with some real strict safety measurements

- using a very small and easy to smoke test project
- never create/adjust types in the GUI/prismic dashboard (only using the sync command to update types)
- e2e+smoke test on staging environment with identical content as production.
- backup plan if the api goes down (e.g when you hit an api rate limit or something similar). Might add something that will echo out JSON type objects that you can copy paste to the prismic dashboard as backup plan.

## :skull: :skull: THIS MODULE WILL WIPE YOUR CUSTOM TYPES. :skull: :skull:

#### Do not use on production environments (if you really want to, be sure to dig into the implications, the custom types API and the way this fork uses the custom types API)

:skull: :skull: :skull: https://github.com/Bram-Zijp/prismic-cli/commit/22e085c400dadad9563f6e1288d1c928fedade64 :skull: :skull: :skull:
:skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull:

### What?

(tested in Next.js Prismic Slicemachine project):
It parses your slices and custom_types/index.json files (see slicemachine example projects) and injects slices into it (unless specified not to).
`prismic sync --token [your_custom_types_api_token] // will upsert (update/insert) types from custom_types/index.json`
`prismic sync --delete --token [your_custom_types_api_token] // upsert (update/insert) all types that are in and deletes ALL types are not in "your custom_types/index.json" file`

Instead of the --token argument, you can also set the following environment variable:

```
PRISMIC_TYPES_TOKEN=[your_custom_types_api_token]
```

# Prismic Command Line for Javascript

[![npm version](https://badge.fury.io/js/prismic-cli.svg)](http://badge.fury.io/js/prismic-cli)
[![Build Status](https://api.travis-ci.org/prismicio/prismic-cli.png)](https://travis-ci.org/prismicio/prismic-cli)

This is a command line tool to bootstrap Javascript project using [prismic.io](https://prismic.io). Currently it can be used to bootstrap projects based on:

- [NodeJS](https://nodejs.org/) ([ExpressJS](https://expressjs.com/))
- [ReactJS](https://facebook.github.io/react/)
- [Angular 2.0](https://angular.io/)
- [NuxtJS](https://nuxtjs.org/)

It is meant to install globally:

```
npm install -g prismic-cli
```

## Usage

Just type `prismic` without any argument to read the manual.

### Examples

Create a new project on the 'foobar' repository:

```
prismic init foobar
```

Create a new NodeJS project on the 'foobar' repository, in the 'foobar' folder (non-interactive)

```
prismic init foobar --folder foobar --template NodeJS
```

## More information

Once your project is bootstrapped, you can find more information about developing with prismic.io in the [documentation](http://prismic.io/docs).

All templates rely on the same [Javascript kit](https://github.com/prismicio/javascript-kit).
