import { flatten, toPairs } from 'ramda';
import globals from '../globals';
import helpCmd from './help';
import versionCmd, {checkVersion} from './version';
import Login from './login';
import Signup from './signup';
import Repository from './repository';
import Template from './template';
import Base from './base';
import Helpers from '../helpers';
import slicemachine from './slicemachine';
import { ctx, setCookies, build as buildContext } from '../context';
import Sentry from '../services/sentry';

export const Commands = Object.assign(
  Helpers.Cmd.apply({ alias: 'init' }),
  Helpers.Cmd.apply({
    alias: 'sliceMachine',
    names: ['slicemachine', 'sm', 'slice-machine'],
    context: {
      appCtx: 'slicemachine',
      isNew: true,
    },
  }),
  Helpers.Cmd.apply({ alias: 'login' }),
  Helpers.Cmd.apply({ alias: 'logout' }),
  Helpers.Cmd.apply({ alias: 'signup' }),
  Helpers.Cmd.apply({
    alias: 'newProject',
    names: ['new'],
    context: {
      isNew: true,
    },
  }),
  Helpers.Cmd.apply({
    alias: 'quickstart',
    context: {
      isNew: true,
      template: (async () => {
        const templates = await Helpers.Prismic.templates();
        const quickstartTmpl = templates.find((tmpl) => tmpl.isQuickstart === true);
        return quickstartTmpl.name;
      })(),
    },
  }),
  Helpers.Cmd.apply({
    alias: 'theme',
    context: {
      isNew: true,
      appCtx: 'slicemachine',
    },
  }),
  Helpers.Cmd.apply({ alias: 'heroku' }),
  Helpers.Cmd.apply({ alias: 'list' }),
  Helpers.Cmd.apply({ alias: 'base' }),
  // null is used for default behavior. It will display the manual of the CLI
  Helpers.Cmd.apply({ alias: 'help', names: [null] }),
);

async function init(theme) {
  if (ctx.isNew && globals.DEFAULT_BASE !== ctx.base) {
    Helpers.UI.display(`CAREFUL, your current base is: ${ctx.base}\n`);
  }
  Helpers.UI.display('Let\'s get to it!');
  const templates = await Helpers.Prismic.templates();
  Repository.create(templates, theme).catch((err) => {
    Sentry.report(err);
    Helpers.UI.display(`Repository creation aborted: ${err}`);
  });
}

async function initWithTheme() {
  try {
    const opts = {
      configPath: ctx.Themes.conf,
      ignoreConf: ctx.Themes.ignoreConf,
    };

    const theme = await Repository.validateTheme(ctx.Themes.url, opts);
    return await init(theme);
  } catch (err) {
    Sentry.report(err);
    return Helpers.UI.display(`Repository creation aborted: ${err}`);
  }
}

async function heroku() {
  const templates = await Helpers.Prismic.templates();
  try {
    Repository.heroku(templates, ctx.Themes.template);
  } catch (err) {
    Sentry.report(err);
    Helpers.UI.display(err.message);
  }
}

async function signup() {
  await Signup(ctx.base);
  Helpers.UI.display('Successfully created your account! You can now create repositories.');
}

async function login() {
  await Login(ctx.base, ctx.Auth.email, ctx.Auth.password);
  Helpers.UI.display('Successfully logged in! You can now create repositories.');
}

function logout() {
  try {
    setCookies(''); // clear the cookies
    Helpers.UI.display('Successfully logged out !');
  } catch (err) {
    Sentry.report(err);
    console.log(err);
  }
}

async function list() {
  Helpers.UI.display('Available templates:');
  const templates = await Helpers.Prismic.templates();
  Helpers.UI.display(Template.getDisplayed(templates).map((template) => `* ${template.name}`));
}

// // Should only be used by staff, which is why it's not documented
// // prismic base http://wroom.dev
async function updateBase() {
  const newBase = await Base();
  Helpers.UI.display(`Successfully changed base ${newBase} !`);
}

export function cliValidCommands() {
  return flatten(toPairs(Commands).map(([, cmd]) => cmd.names));
}

export async function run(cmdName, args = []) {
  const cmd = Helpers.Cmd.fromName(cmdName, Commands);
  if (!cmd) return helpCmd();

  buildContext(cmd, args);

  switch (cmd.alias) {
    case Commands.init.alias: return init();
    case Commands.sliceMachine.alias: return slicemachine();
    case Commands.login.alias: return login();
    case Commands.logout.alias: return logout();
    case Commands.signup.alias: return signup();
    case Commands.newProject.alias: return init();
    case Commands.quickstart.alias: return init();
    case Commands.theme.alias: return initWithTheme();
    case Commands.heroku.alias: return heroku();
    case Commands.list.alias: return list();
    case Commands.base.alias: return updateBase();
    default: {
      if (ctx.version) return versionCmd();
      return helpCmd();
    }
  }
}
