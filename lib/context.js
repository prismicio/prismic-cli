import { mergeRight } from 'ramda';
import globals from './globals';
import Helpers from './helpers';
import LocalDB from './services/localDB';
import { Commands } from './commands/index';

function argsToMap(args) {
  const withValueRegex = new RegExp('^--.+$');
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
      apiEndpoint: argsMap['--endpoint']
    }
  }
}

export let ctx = null;

export async function build(command, args) {
  console.log(command)

  const localData = await LocalDB.getAll();
  const parsedArgs = parseArgs(args);

  const predefinedTemplate = await (async () => {
    if(command.alias == Commands.quickstart.alias) {
      const templates = await Helpers.Prismic.templates()
     return templates.find(tmpl => tmpl.isQuickstart === true);
    } else return null;
  })();

  ctx = {
    appCtx: command.alias === Commands.sliceMachine.alias ? 'slicemachine' : null,
    cookies: localData.cookies,
    base: parsedArgs.base || localData.base || globals.DEFAULT_BASE,
    endpoint: localData.endpoint || globals.DEFAULT_ENDPOINT,
    domain: parsedArgs.domain || globals.DEFAULT_DOMAIN,
    debug: parsedArgs.debug,
    folder: parsedArgs.folder,
    noConfirm: parsedArgs.noConfirm,
    isNew:  command.alias === Commands.newProject.alias || command.alias === Commands.quickstart.alias || command.alias === Commands.theme.alias,
    users: parsedArgs.users,
    version: parsedArgs.version,
    Auth: {
      email: parsedArgs.Auth.email,
      password: parsedArgs.Auth.password,
      oauthAccessToken: parsedArgs.Auth.oauthAccessToken,
      magicLink: localData.magicLink
    },
    Theme: {
      template: predefinedTemplate || parsedArgs.Themes.template,
      url: parsedArgs.Themes.url,
      ignoreConf: parsedArgs.Themes.ignoreConf,
      conf: parsedArgs.Themes.conf || Helpers.Theme.defaultConfigPath
    },
    SliceMachine: {
      apiEndpoint: globals.DEFAULT_SM_ENDPOINT
    }
  }
  console.log(ctx)
  return ctx;
}

export function setCookies(cookies) {
  ctx = mergeRight(ctx, { cookies: cookies });
  return LocalDB.set({ cookies });
}

export function setMagicLink(magicLink) {
  ctx = mergeRight(ctx, { Auth: { magicLink } });
  return LocalDB.set({ cookies });
}

export function setBase(base) {
  ctx = mergeRight(ctx, { base });
  return LocalDB.set({ base });
}

// const SliceMachineOptions = {
//   demo: '--demo',
//   skipPrismic: '--skip-prismic',
//   skipBootstraper: '--skip-bootstraper',
//   framework: '--framework',
// };