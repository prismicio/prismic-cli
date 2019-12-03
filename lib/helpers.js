import Prismic from 'prismic.io';
import PrismicConfig from './prismic-configuration';

const DEFAULT_DOMAIN = 'https://prismic.io';
const DEFAULT_CONFIG_PATH = './prismic-configuration.js';

function makeTemplate(name, url, configuration, innerFolder, instructions, isQuickstart, ignoreConf = false) {
  const config = configuration || DEFAULT_CONFIG_PATH;
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

export default {
  UI: {
    display(messages) {
      if (typeof messages === 'string') {
        process.stdout.write(`${messages}\n`);
      } else if (typeof messages.join === 'function') {
        process.stdout.write(`${messages.join('\n')}\n`);
      }
    },
    displayErrors(errors) {
      if (!errors) {
        process.stdout.write(`An unexpected error occured`);
      }
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
    default: DEFAULT_DOMAIN,
    repository(base, domain) {
      const matches = (base || DEFAULT_DOMAIN).match(new RegExp('((https?://)([^/]*))'));
      return `${matches[2]}${domain}.${matches[3]}`;
    },
    api(base, domain) {
      return `${this.repository(base, domain)}/api`;
    },
  },
  Theme: {
    defaultConfigPath: DEFAULT_CONFIG_PATH,
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
};
