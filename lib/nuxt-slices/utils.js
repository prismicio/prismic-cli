
export const createLinkResolverPluginFile = () => `// -- Links resolution rules
// This function will be used to generate links to Prismic documents
// As your project grows, you should update this function according to your routes
export default (doc) => {
  switch (doc.type) {
    case ('page'): return \`/\${doc.uid}\`
    case ('homepage'): return '/'
    default: return '/'
  }
}`;

export const createPrismicConfigurationFile = (base, domain) => {
  const matches = base.match(/(https?:\/\/)(.*)/);
  const protocol = matches[1];
  const url = matches[2];
  return `const api = {
  apiEndpoint: "${protocol}${domain}.${url}/api/v2",
}

module.exports = api;`;
};

export const createPrismicVuePluginFile = resolverFileName => `import Vue from 'vue'
import PrismicVue from 'prismic-vue'
import linkResolver from './${resolverFileName}'

Vue.use(PrismicVue, { linkResolver })`;
