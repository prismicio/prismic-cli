export default {
  DEFAULT_DOMAIN: 'prismic.io',

  CustomTypesApi: {
    regexp: /^((https?):\/\/)?([-a-zA-Z0-9_]+)([.]cdn)?[.]?((prismic|wroom)\.(io|test|dev))?/,

    // returns { isSecuredScheme: boolean; subdomain: string; domain: string }
    _parse(repositoryName) {
      const result = repositoryName.match(this.regexp);
      if (result) {
        const subdomain = result[3];
        const domain = result[5];
        const isSecuredScheme =
          Boolean(result[2] && result[2] === 'https') ||
          !domain ||
          domain === this.DEFAULT_DOMAIN ||
          domain === 'wroom.io';

        return { isSecuredScheme, subdomain, domain: domain || this.DEFAULT_DOMAIN };
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
      return `${this.root(repositoryName)}/customtypes/slices`;
    },
  },

  SliceMachine: {
    SLICES_API: 'https://community-slices.herokuapp.com',
    SLICES_API_LOCAL: 'http://localhost:3010',

    api(isDevMode) {
      return `${isDevMode ? this.SLICES_API_LOCAL : this.SLICES_API}/api`;
    },

    models(isDevMode, framework) {
      return `${this.api(isDevMode)}/models?framework=${framework}`;
    },

    slices(isDevMode, framework) {
      return `${this.api(isDevMode)}/slices?framework=${framework}`;
    },
  },
};
