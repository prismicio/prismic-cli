import { mapObjIndexed, flatten } from 'ramda';
import LocalDB from '../services/localDB';
import Global from '../globals';

import help from './help';
import Signin from './login';
import Signup from './signup';
import Repository from './repository';
import initSlices from './slicemachine';
import Template from './template';
import Base from './base';
import Helpers, { Cmd } from './helpers';

const Commands = Object.assign(
  Cmd.apply({ alias: 'init' }),
  Cmd.apply({
    alias: 'sliceMachine',
    names: ['slicemachine', 'sm', 'slice-machine'],
  }),
  Cmd.apply({ alias: 'login' }),
  Cmd.apply({ alias: 'logout' }),
  Cmd.apply({ alias: 'signup' }),
  Cmd.apply({ alias: 'newProject', names: ['new'] }),
  Cmd.apply({ alias: 'quickstart' }),
  Cmd.apply({ alias: 'theme' }),
  Cmd.apply({ alias: 'heroku' }),
  Cmd.apply({ alias: 'list' }),
  Cmd.apply({ alias: 'base' }),
  // null is used for default behavior. It will display the manual of the CLI
  Cmd.apply({ alias: 'help', names: [null] }),
);

// === Commands

// function version() {
//   Helpers.UI.display(pjson.version);
// }

async function init(ctx, theme) {
  if (ctx.isNew && Global._DEFAULT_DOMAIN != ctx.base) {
    Helpers.UI.display(`CAREFUL, your current base is: ${ctx.base}\n`);
  }
  Helpers.UI.display('Let\'s get to it!');
  const templates = await Helpers.Prismic.templates();
  Repository.create(templates, ctx, theme).catch((err) => {
    Helpers.UI.display(`Repository creation aborted: ${err}`);
  });
}

async function initWithTheme(config, url, args) {
  try {
    const opts = {
      configPath: ctx.Themes.conf,
      ignoreConf: ctx.Themes.ignoreConf,
    };

    const theme = await Repository.validateTheme(url, opts);
    return await init(ctx, theme);
  } catch (err) {
    return Helpers.UI.display(`Repository creation aborted: ${err}`);
  }
}

async function heroku(ctx) {
  const templates = Helpers.Prismic.templates();
  try {
    Repository.heroku(templates, ctx.Theme.template);
  } catch (err) {
    Helpers.UI.display(err);
  }
}

async function signup(ctx) {
  await Signup(ctx.base, ctx.Auth.email, ctx.Auth.password);
  Helpers.UI.display('Successfully created your account! You can now create repositories.');
}

async function login(ctx) {
  await Signin(ctx.base, ctx.Auth.email, ctx.Auth.password);
  Helpers.UI.display('Successfully logged in! You can now create repositories.');
}

async function logout() {
  try {
    await LocalDB.set({ cookies: '' }); // clear the cookies
    Helpers.UI.display('Successfully logged out !');
  } catch (err) {
    console.log(err);
  }
}

async function list() {
  Helpers.UI.display('Available templates:');
  const templates = await Helpers.Prismic.templates();
  Helpers.UI.display(Template.getDisplayed(templates).map(template => `* ${template.name}`));
}

// // Should only be used by staff, which is why it's not documented
// // prismic base http://wroom.dev
async function updateBase(base) {
  const newBase = await Base(base);
  Helpers.UI.display(`Successfully changed base ${newBase} !`);
}

export default {
  cliValidCommands() {
    return flatten(mapObjIndexed(cmd => cmd.names, Commands));
  },

  run(cmdName, ctx) {
    const cmd = Cmd.fromName(cmdName);
    switch (cmd.alias) {
      case Commands.init.alias: return init(ctx);
      // case Commands.sliceMachine.alias: return sliceMachine(ctx);
      case Commands.login.alias: return login(ctx);
      case Commands.logout.alias: return logout();
      case Commands.signup.alias: return signup(ctx);
      case Commands.new.alias: return init(ctx);
      case Commands.quickstart.alias: return init(ctx);
      case Commands.theme.alias: return init(ctx);
      case Commands.heroku.alias: return heroku(ctx);
      case Commands.list.alias: return list(ctx);
      case Commands.base.alias: return base(ctx.base);
      default: return help(ctx);
    }
  },
};

// const SliceMachineCommands = Object.assign({},
//   Cmd.apply({ alias: 'endpoint' }),
//   Cmd.apply({ alias: 'sync' }),
// );
