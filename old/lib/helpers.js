import { toPairs } from 'ramda';
import Prismic from 'prismic.io';
import PrismicConfig from './prismic-configuration';
import { ctx } from './context'; // eslint-disable-line
import globals from './globals';

function makeTemplate(name, url, configuration, innerFolder, instructions, isQuickstart, ignoreConf = false) {
  const config = configuration || globals.DEFAULT_CONFIG_PATH;
  return {
    name,
    url,
    configuration: ignoreConf ? null : config,
    innerFolder,
    instructions,
    isQuickstart: isQuickstart || false,
  };
}

function convertDocToTemplates(doc) {
  return doc.getSliceZone('cli.templates').slices.reduce((acc, s) => {
    if (s.sliceType === 'template') {
      const template = s.value.toArray()[0];
      return acc.concat([makeTemplate(
        template.getText('name'),
        template.getText('url'),
        template.getText('configuration'),
        template.getText('innerFolder'),
        template.getText('instructions'),
        template.getText('is-quickstart') === 'yes',
      )]);
    }
    return acc;
  }, []);
}

const Helpers = {
  UI: {
    display(messages) {
      if (typeof messages === 'string') {
        process.stdout.write(`${messages}\n`);
      } else if (typeof messages.join === 'function') {
        process.stdout.write(`${messages.join('\n')}\n`);
      }
    },
    debug(msg) {
      process.stdout.write(`${msg}\n`);
    },
    displayErrors(errors) {
      if (typeof errors === 'string') {
        process.stdout.write(`${errors}\n`);
      } else {
        const errorsMsg = Object.keys(errors).reduce((acc, field) => {
          const fieldErrors = errors[field];
          return acc.concat(fieldErrors);
        }, []);
        this.display(errorsMsg);
      }
    },
  },
  Prismic: {
    getApi() {
      return Prismic.api(PrismicConfig.apiEndpoint);
    },

    async templates() {
      try {
        const api = await this.getApi();
        const doc = await api.getSingle('cli');
        return convertDocToTemplates(doc);
      } catch (err) {
        return [];
      }
    },
  },
  Domain: {
    repository(base, domain) {
      const matches = (base || globals.DEFAULT_BASE).match(new RegExp('((https?://)([^/]*))'));
      return `${matches[2]}${domain}.${matches[3]}`;
    },
    api(base, domain) {
      return `${this.repository(base, domain)}/api`;
    },
  },

  Theme: {
    defaultConfigPath: globals.DEFAULT_CONFIG_PATH,
    make(name, url, configPath, ignoreConf, tmpFolder, innerFolder) {
      return {
        tmpFolder,
        template: makeTemplate(name, url, configPath, innerFolder, ignoreConf),
      };
    },
  },
  Json: {
    merge(obj, other) {
      const result = this.copy(obj);
      Object.keys(other).forEach((key) => {
        result[key] = other[key];
      });
      return result;
    },
    copy(obj) {
      const result = {};
      Object.keys(obj).forEach((key) => {
        result[key] = obj[key];
      });
      return result;
    },
  },
  MagicLink: {
    parse(response) {
      try {
        const { token } = JSON.parse(response);
        return token;
      } catch (e) {
        return null;
      }
    },
    buildRedirectUrl(base, domain) {
      const token = ctx.Auth.magicLink;
      const redirectUri = Helpers.Domain.repository(base, domain);
      if (token) {
        return `${(base || globals.DEFAULT_BASE)}/magic?token=${token}&redirectUri=${redirectUri}`;
      }
      return redirectUri;
    },
  },
  Url: {
    // param should be an array of tuples [[key, value]]
    buildQueryString(params) {
      if (!params) return '';
      const formattedParams = Object.entries(params)
        .filter(([, v]) => !!v)
        .map(([k, v]) => `${k}=${v}`);

      if (formattedParams.length === 0) return '';
      return `?${formattedParams.join('&')}`;
    },
  },
  Cmd: {
    apply({ alias, names, context }) {
      return {
        [alias]: {
          alias,
          names: names || [alias],
          context,
        },
      };
    },

    fromName(cmdName, commands) {
      return toPairs(commands).reduce((acc, [, cmd]) => {
        if (cmd.names.includes(cmdName)) {
          return cmd;
        }
        return acc;
      }, null);
    },
  },
};

export default Helpers;
