'use strict';

import PrismicConfig from './prismic-configuration';
import Prismic from 'prismic.io';

const Types = {
  String: 'string',
  Object: 'object'
};

const DEFAULT_CONFIG_PATH = './prismic-configuration.js';

function convertDocToTemplates(doc) {
  return doc.getSliceZone('cli.templates').slices.reduce((acc, s) => {
    if(s.sliceType === 'template') {
      const template = s.value.toArray()[0];
      return acc.concat([makeTemplate(
        template.getText('name'),
        template.getText('url'),
        template.getText('configuration'),
        template.getText('innerFolder'),
        template.getText('instructions'),
        'yes' === template.getText('is-quickstart')
      )]);
    } else {
      return acc;
    }
  }, []);
}

function makeTemplate(name, url, configuration, innerFolder, instructions, isQuickstart) {
  const config = configuration || DEFAULT_CONFIG_PATH;
  return {name, url, configuration: config, innerFolder, instructions, isQuickstart: isQuickstart || false};
}

export default {
  UI: {
    display(messages) {
      if(Types.String === typeof messages) console.log(messages);
      else console.log(messages.join('\n'));
    },
    displayErrors(errors) {
      if(Types.String === typeof errors) console.log(errors);
      else {
        const errorsMsg = Object.keys(errors).reduce((acc, field) => {
          const fieldErrors = errors[field];
          return acc.concat(fieldErrors);
        }, []);
        this.display(errorsMsg);
      }
    }
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
      } catch(err) {
        return [];
      }
    }
  },
  Domain : {
    default: 'https://prismic.io',
    repository(base, domain) {
      const matches = (base || this.default).match(new RegExp('((https?://)([^/]*))'));
      return matches[2] + domain + '.' + matches[3];
    },
    api(base, domain) {
      return `${this.repository(base, domain)}/api`;
    }
  },
  Theme: {
    defaultConfigPath: DEFAULT_CONFIG_PATH,

    make(name, url, tmpFolder, innerFolder) {
      return {tmpFolder, template: makeTemplate(name, url, this.defaultConfigPath, innerFolder)};
    }
  },
  Json: {
    merge(obj, other) {
      let result = this.copy(obj);
      Object.keys(other).forEach(key => result[key] = other[key]);
      return result;
    },
    copy(obj) {
      let result = {};
      Object.keys(obj).forEach(key => result[key] = obj[key]);
      return result;
    }
  }
};
