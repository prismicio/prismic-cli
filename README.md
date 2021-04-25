### This fork is not for production use but for demoing purposes only.

I will use it only with some real strict safety measurements

- using a very small and easy to smoke test project
- never create/adjust types in the GUI/prismic dashboard (only using the sync command to update types)
- e2e+smoke test on staging environment with identical content as production.
- backup plan if the api goes down (e.g when you hit an api rate limit or something similar). Might add something that will echo out JSON type objects that you can copy paste to the prismic dashboard as backup plan.
- get more confident this fork is stable.

### What?

Added command

- `prismic sync`

Arguments

- `--custom-types` will upsert custom_types
- `--slices` will upsert slices
- `--dangerous-delete` will also delete "custom_types" and or "slices" from your Prismic CMS API if they don't exist in your codebase it's "custom_types" or "slices library's". E.g. `prismic sync --dangerous-delete --custom-types` will delete and upsert "custom-types" only, where appropriate.

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
