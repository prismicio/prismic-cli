### I would not recommend using this module at all.

## :skull: :skull: THIS MODULE WILL WIPE YOUR CUSTOM TYPES. :skull: :skull:

:skull: :skull: :skull: https://github.com/Bram-Zijp/prismic-cli/commit/3d34f2f9af71e2324df53f31f79072dbe1c9005c :skull: :skull: :skull:
:skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull: :skull:

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
