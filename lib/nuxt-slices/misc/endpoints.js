export default {
  DEFAULT_DOMAIN: 'prismic.io',

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
  root(repositoryName, withCDN) {
    const { isSecuredScheme, subdomain, domain } = this._parse(repositoryName);
    const scheme = isSecuredScheme ? 'https' : 'http';
    const cdn = isSecuredScheme && withCDN ? '.cdn' : '';
    return `${scheme}://${subdomain}${cdn}.${domain}`;
  },
};
