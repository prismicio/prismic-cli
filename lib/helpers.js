'use strict';

import PrismicConfig from './prismic-configuration';
import Prismic from 'prismic.io';

const Types = {
  String: 'string',
  Object: 'object'
};

function convertDocToTemplates(doc) {
  return doc.getSliceZone('cli.templates').slices.reduce((acc, s) => {
    if(s.sliceType === 'template') {
      const template = s.value.toArray()[0];
      return acc.concat([makeTemplate(
        template.getText('name'),
        template.getText('url'),
        template.getText('innerFolder'),
        template.getText('configuration'),
        template.getText('instructions'),
        'yes' === template.getText('is-quickstart')
      )]);
    } else {
      return acc;
    }
  }, []);
}

function makeTemplate(name, url, innerFolder, configuration, instructions, isQuickstart) {
  const config = configuration || './prismic-configuration.js';
  return {name, url, innerFolder, configuration: config, instructions, isQuickstart: false};
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
  Theme: {
    make(name, url, innerFolder, tmpFolder) {
      return {tmpFolder, template: makeTemplate(name, url, innerFolder)};
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
