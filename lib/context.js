import * as globals from 'globals';
import * as localDB from 'localDB';

function parseArgs(args) {
  return {
    base: args['--base'],
    domain: args['--domain'],
    debug: args['--debug'],
    version: args['--version'],
    folder: args['--folder'],
    noconfirm: args['--noconfirm'],
    isNew: args['--new'],
    users: args['--users'],
    Auth: {
      email: args['--email'],
      password: args['--password'],
      oauthAccessToken: args['--oauthaccesstoken'],
    },
    Themes: {
      template: args['--template'],
      conf: args['--conf'],
      ignoreConf: args['--ignore-conf'],
    },
  }
}

export default {
  async build(command, args) {
    const localData = await localDB.getAll();
    const parsedArgs = parseArgs(args);

    const predefinedTemplate = await (async () => {
      if(command == Commands.quickstart) {
        const templates = await Helpers.Prismic.templates()
       return templates.find(tmpl => tmpl.isQuickstart === true);
      } else return null;
    })();

    return {
      appCtx: command === Commands.SliceMachine ? 'slicemachine' : null,
      cookies: localData.cookies,
      base: parsedArgs.base || localData.base || DEFAULT_BASE,
      endpoint: localData.endpoint || DEFAULT_ENDPOINT,
      domain: parsedArgs.domain || DEFAULT_DOMAIN,
      debug: parsedArgs.debug,
      folder: parsedArgs.folder,
      noConfirm: parsedArgs.noConfirm,
      isNew: command == (Commands.newProject || Commands.quickstart || Commands.theme) || parsedArgs.isNew,
      users: parseArgs.users,
      Auth: {
        email: parsedArgs.Auth.email,
        password: parsedArgs.Auth.password,
        oauthAccessToken: parsedArgs.Auth.oauthAccessToken,
      },
      Theme: {
        template: predefinedTemplate || parsedArgs.Themes.template,
        ignoreConf: parsedArgs.Themes.ignoreConf,
        conf: parsedArgs.Themes.conf || Helpers.Theme.defaultConfigPath
      }
    }
  }
}

// const SliceMachineOptions = {
//   demo: '--demo',
//   skipPrismic: '--skip-prismic',
//   skipBootstraper: '--skip-bootstraper',
//   framework: '--framework',
// };