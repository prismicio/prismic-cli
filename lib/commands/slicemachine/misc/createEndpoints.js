import globals from '../../../globals';
import { ctx } from '../../../context';

const createEndpoints = () => ({
  CustomTypesApi: {
    regexp: /^((https?):\/\/)?([-a-zA-Z0-9_]+)([.]cdn)?[.]?((prismic|wroom)\.(io|test|dev))?/,

    // returns { isSecuredScheme: boolean; subdomain: string; domain: string }
    _parse(repositoryName) {
      const result = repositoryName.match(this.regexp);
      if (result) {
        const subdomain = result[3];
        const domain = result[5];
        const isSecuredScheme =
          Boolean(result[2] && result[2] === "https") ||
          !domain ||
          domain === globals.DEFAULT_DOMAIN ||
          domain === "wroom.io";

        return {
          isSecuredScheme,
          subdomain,
          domain: domain || globals.DEFAULT_DOMAIN
        };
      }
      throw `Invalid Prismic repository name provided: ${repositoryName}`; // eslint-disable-line
    },

    // returns string
    root(repositoryName) {
      const { isSecuredScheme, subdomain, domain } = this._parse(
        repositoryName
      );
      const scheme = isSecuredScheme ? "https" : "http";
      return `${scheme}://${subdomain}.${domain}`;
    },

    customTypes(repositoryName) {
      return `${this.root(repositoryName)}/customtypes/slices`;
    }
  },

  SliceMachine: {
    api() {
      return ctx.SliceMachine.apiEndpoint;
    },

    models() {
      return `${this.api()}/models`;
    },

    slices() {
      return `${this.api()}/slices`;
    },
    boot() {
      return `${this.api()}/bootstrap`;
    }
  }
});

export default createEndpoints;
