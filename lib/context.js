import { mergeRight } from 'ramda';
import globals from './globals';
import Helpers from './helpers';
import LocalDB from './services/localDB';

function argsToMap(args) {
  const withValueRegex = new RegExp('^--.+$');
  if (!args) return {};
  const argts = {};
  let current = null;
  args.forEach((value) => {
    if (value.match(withValueRegex)) {
      argts[value] = true;
      current = value;
    } else {
      argts[current] = value;
    }
  });
  return argts;
}

function parseArgs(args) {
  const argsMap = argsToMap(args);

  return {
    base: argsMap['--base'],
    domain: argsMap['--domain'],
    debug: argsMap['--debug'],
    version: argsMap['--version'],
    folder: argsMap['--folder'],
    noconfirm: argsMap['--noconfirm'],
    isNew: argsMap['--new'],
    users: argsMap['--users'],
    Auth: {
      email: argsMap['--email'],
      password: argsMap['--password'],
      oauthAccessToken: argsMap['--oauthaccesstoken'],
    },
    Themes: {
      url: argsMap['--theme-url'],
      template: argsMap['--template'],
      conf: argsMap['--conf'],
      ignoreConf: argsMap['--ignore-conf'],
    },
    SliceMachine: {
      sync: argsMap['--sync'],
      isDemo: argsMap['--demo'],
      skipPrismic: argsMap['--skip-prismic'],
      skipBootstrapper: argsMap['--skip-bootstrapper'],
      framework: argsMap['--framework'],
      apiEndpoint: argsMap['--endpoint'],
      override: argsMap['--override'],
    },
  };
}

// eslint-disable-next-line import/no-mutable-exports
export let ctx = null;

export function build(command, args) {
  const localData = LocalDB.getAll();
  const parsedArgs = parseArgs(args);

  ctx = Object.assign({}, {
    cookies: localData.cookies,
    base: parsedArgs.base || localData.base || globals.DEFAULT_BASE,
    endpoint: localData.endpoint || globals.DEFAULT_ENDPOINT,
    domain: parsedArgs.domain,
    debug: parsedArgs.debug,
    folder: parsedArgs.folder,
    noConfirm: parsedArgs.noConfirm,
    isNew: parsedArgs.isNew,
    users: parsedArgs.users,
    version: parsedArgs.version,
    Auth: {
      email: parsedArgs.Auth.email,
      password: parsedArgs.Auth.password,
      oauthAccessToken: parsedArgs.Auth.oauthAccessToken,
      magicLink: localData.magicLink,
    },
    Themes: {
      template: parsedArgs.Themes.template,
      url: parsedArgs.Themes.url,
      ignoreConf: parsedArgs.Themes.ignoreConf,
      conf: parsedArgs.Themes.conf || Helpers.Theme.defaultConfigPath,
    },
    SliceMachine: {
      sync: parsedArgs.SliceMachine.sync,
      isDemo: parsedArgs.SliceMachine.isDemo,
      skipPrismic: parsedArgs.SliceMachine.skipPrismic,
      skipBootstrapper: parsedArgs.SliceMachine.skipBootstrapper,
      framework: parsedArgs.SliceMachine.framework,
      apiEndpoint: parsedArgs.SliceMachine.apiEndpoint || localData.apiEndpoint || globals.DEFAULT_SM_ENDPOINT,
      override: parsedArgs.SliceMachine.override,
    },
  }, { ...command.context });
  return ctx;
}

export function setCookies(cookies) {
  ctx = mergeRight(ctx, { cookies });
  LocalDB.set({ cookies });
}

export function setMagicLink(magicLink) {
  ctx = mergeRight(ctx, { Auth: { magicLink } });
  LocalDB.set({ magicLink });
}

export function setBase(base) {
  ctx = mergeRight(ctx, { base });
  LocalDB.set({ base });
}

export function setSlicemachineEndpoint(endpoint) {
  ctx = mergeRight(ctx, { SliceMachine: { apiEndpoint: endpoint } });
  LocalDB.set({ apiEndpoint: endpoint });
}
