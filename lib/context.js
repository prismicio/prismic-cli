import { mergeRight } from 'ramda';
import globals from './globals';
import Helpers from "./helpers"; // eslint-disable-line
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
    baseUrl: argsMap['--base-url'],
    domain: argsMap['--domain'],
    endpoint: argsMap['--endpoint'],
    debug: argsMap['--debug'],
    version: argsMap['--version'],
    folder: argsMap['--folder'],
    noconfirm: argsMap['--noconfirm'],
    isNew: argsMap['--new'],
    users: argsMap['--users'],
    skipInstall: argsMap['--no-install'] || argsMap['--skip-install'],
    delete: argsMap['--delete'],
    token: argsMap['--token'],
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
      customTypes: argsMap['--custom-types'],
      documents: argsMap['--documents'],
    },
    SliceMachine: {
      lib: argsMap['--lib'],
      library: argsMap['--library'],
      yes: argsMap['--noconfirm'] || argsMap['--yes'] || argsMap['-y'],
      ls: argsMap['--ls'],
      setup: argsMap['--setup'],
      develop: argsMap['--develop'],
      bootstrap: argsMap['--bootstrap'],
      createSlice: argsMap['--create-slice'],
      addStorybook: argsMap['--add-storybook'],
      localSlicesPath: argsMap['--local-path'],
      noPrismic: argsMap['--no-prismic'],
      framework: argsMap['--framework'],
      templatePath: argsMap['--template-path'],
      apiEndpoint: argsMap['--sm-endpoint'],
      override: argsMap['--override'],
      sliceName: argsMap['--slice-name'],
      localLibrary: argsMap['--local-library'],
      customTypeEndpoint:
        argsMap['--ct-endpoint'] || argsMap['--custom-type-endpoint'],
      noStart: argsMap['--no-start'],
    },
  };
}

export let ctx = null; // eslint-disable-line

export function build(command, args) {
  const localData = LocalDB.getAll();
  const parsedArgs = parseArgs(args);

  ctx = {
    cookies: localData.cookies,
    base: parsedArgs.base || localData.base || globals.DEFAULT_BASE,
    baseUrl: parsedArgs.baseUrl,
    endpoint: parsedArgs.endpoint || localData.endpoint,
    domain: parsedArgs.domain,
    debug: parsedArgs.debug,
    folder: parsedArgs.folder,
    noConfirm: parsedArgs.noConfirm,
    isNew: parsedArgs.isNew,
    users: parsedArgs.users,
    version: parsedArgs.version,
    skipInstall: parsedArgs.skipInstall,
    deleteArg: parsedArgs.delete,
    token: parsedArgs.token,
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
      customTypes: parsedArgs.Themes.customTypes,
      documents: parsedArgs.Themes.documents,
    },
    SliceMachine: {
      lib: parsedArgs.SliceMachine.lib || parsedArgs.SliceMachine.library,
      yes: parsedArgs.SliceMachine.yes,
      ls: parsedArgs.SliceMachine.ls,
      setup: parsedArgs.SliceMachine.setup,
      develop: parsedArgs.SliceMachine.develop,
      bootstrap: parsedArgs.SliceMachine.bootstrap,
      createSlice: parsedArgs.SliceMachine.createSlice,
      addStorybook: parsedArgs.SliceMachine.addStorybook,
      localSlicesPath:
        parsedArgs.SliceMachine.localSlicesPath
        || globals.DEFAULT_LOCAL_SLICES_PATH,
      noPrismic: parsedArgs.SliceMachine.noPrismic,
      framework: parsedArgs.SliceMachine.framework,
      templatePath: parsedArgs.SliceMachine.templatePath,
      apiEndpoint:
        parsedArgs.SliceMachine.apiEndpoint
        || localData.apiEndpoint
        || globals.DEFAULT_SM_ENDPOINT,
      sliceName: parsedArgs.SliceMachine.sliceName,
      localLibrary: parsedArgs.SliceMachine.localLibrary,
      customTypeEndpoint: parsedArgs.SliceMachine.customTypeEndpoint,
      noStart: parsedArgs.SliceMachine.noStart,
    },
    ...command.context,
  };
  return ctx;
}

function cookieToObject(cookie) {
  return cookie
    .split(/;(?=\w)/)
    .filter((str) => str)
    .reduce((acc, str) => {
      const n = str.indexOf('=');
      const key = str.substr(0, n);
      const value = str.substr(1 + n - str.length);
      return { ...acc, [key]: value };
    }, {});
}

function objectToCookie(obj) {
  return Object.entries(obj)
    .map((arr) => arr.filter((str) => str).join('='))
    .join(';');
}

export function removeCookies() {
  ctx = { ...ctx, cookies: '' };
  LocalDB.set({ cookies: '' });
}

export function setCookies(cookies = '') {
  if (!cookies) return removeCookies();
  const oldCookiestring = LocalDB.get('cookies') || '';
  const oldCookie = cookieToObject(oldCookiestring);
  const newCookie = cookieToObject(cookies);
  const cookieAsString = objectToCookie({ ...oldCookie, ...newCookie });
  ctx = mergeRight(ctx, { cookies: cookieAsString });
  return LocalDB.set({ cookies: cookieAsString });
}

export function setMagicLink(magicLink) {
  ctx = mergeRight(ctx, { Auth: { magicLink } });
  LocalDB.set({ magicLink });
}

export function setBase(base) {
  ctx = mergeRight(ctx, { base });
  LocalDB.set({ base });
}

export function getBase() {
  return LocalDB.get('base');
}

export function setSlicemachineEndpoint(endpoint) {
  ctx = mergeRight(ctx, { SliceMachine: { apiEndpoint: endpoint } });
  LocalDB.set({ apiEndpoint: endpoint });
}
