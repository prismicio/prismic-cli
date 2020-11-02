import fs from 'fs';
import path from 'path';

import globals from '../../../globals';
import Sentry from '../../../services/sentry';
import { ctx } from '../../../context';

const Endpoints = {
  Prismic: {
    regexp: /^((https?):\/\/)?([-a-zA-Z0-9_]+)([.]cdn)?[.]?((prismic|wroom)\.(io|test|dev))?/,

    // returns { isSecuredScheme: boolean; subdomain: string; domain: string }
    _parse(repositoryName) {
      const result = repositoryName.match(this.regexp);
      if (result) {
        const subdomain = result[3];
        const domain = result[5];
        const isSecuredScheme = Boolean(result[2] && result[2] === 'https')
          || !domain
          || domain === globals.DEFAULT_DOMAIN
          || domain === 'wroom.io';

        return { isSecuredScheme, subdomain, domain: domain || globals.DEFAULT_DOMAIN };
      }
      throw `Invalid Prismic repository name provided: ${repositoryName}`; // eslint-disable-line
    },

    // returns string
    root(repositoryName) {
      const { isSecuredScheme, subdomain, domain } = this._parse(repositoryName);
      const scheme = isSecuredScheme ? 'https' : 'http';
      return `${scheme}://${subdomain}.${domain}`;
    },

    customTypes(repositoryName) {
      return `${this.root(repositoryName)}/customtypes`;
    },

    slices(endpoint) {
      return `${this.root(endpoint, false)}/slices`;
    },

    documentsList(endpoint) {
      return `${this.root(endpoint, false)}/documents`;
    },

    fromCtxOrConfig(configPath = globals.DEFAULT_SM_CONFIG_PATH) {
      if (!(ctx.endpoint || ctx.domain)) {
        try {
          const file = fs.readFileSync(path.join(process.cwd(), configPath), 'utf8');
          const jsConfig = JSON.parse(file);
          return jsConfig.apiEndpoint;
        } catch (e) {
          Sentry.report(e);
          return null;
        }
      }
      return ctx.endpoint || ctx.domain;
    },
  },

  SliceMachine: {
    api() {
      return ctx.SliceMachine.apiEndpoint;
    },

    librairies() {
      return `${this.api()}/libraries`;
    },

    slices() {
      return `${this.api()}/slices`;
    },
  },
};

export default Endpoints;
