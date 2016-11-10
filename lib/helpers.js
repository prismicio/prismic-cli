'use strict';

import PrismicConfig from './prismic-configuration';
import Prismic from 'prismic.io';

const Types = {
  String: 'string',
  Object: 'object'
};


const devTemplates = [{
  name: 'Nodejs-blog',
  url: 'https://github.com/prismicio/nodejs-blog/archive/master.zip',
  innerFolder: 'nodejs-blog-master',
  configuration: './prismic-configuration.js',
  instructions: null,
  isQuickstart: 'no'
}];

function convertDocToTemplates(doc) {
  const prodTemplates = doc.getSliceZone('cli.templates').slices.reduce((acc, s) => {
    if(s.sliceType === 'template') {
      const template = s.value.toArray()[0];
      return acc.concat([{
        name: template.getText('name'),
        url: template.getText('url'),
        innerFolder: template.getText('innerFolder'),
        configuration: template.getText('configuration'),
        instructions: template.getText('instructions'),
        isQuickstart: 'yes' === template.getText('is-quickstart')
      }]);
    } else {
      return acc;
    }
  }, []);

  return prodTemplates.concat(devTemplates);
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
