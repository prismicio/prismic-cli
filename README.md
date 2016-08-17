# Prismic Command Line for Javascript

[![npm version](https://badge.fury.io/js/prismic-cli.svg)](http://badge.fury.io/js/prismic-cli)

This is a command line tool to bootstrap Javascript project using [prismic.io](https://prismic.io). Currently it can be used to bootstrap projects based on:

* [NodeJS](https://nodejs.org/) ([ExpressJS](https://expressjs.com/))
* [ReactJS](https://facebook.github.io/react/)
* [Angular 2.0](https://angular.io/)

It is meant to install globally:

```
npm install -g prismic-cli
```

# Usage

Just type `prismic` without any argument to read the manual.

Some examples:

Create a new project on the 'foobar' repository:
```
prismic init foobar
```

Create a new NodeJS project on the 'foobar' repository, in the 'foobar' folder (non-interactive)
```
prismic init foobar --folder foobar --template NodeJS
```

# More information

Once your project is bootstrapped, you can find more information about developing with prismic.io in the [documentation](http://prismic.io/docs).

All templates rely on the same [Javascript kit](https://github.com/prismicio/javascript-kit).
