import Vue from 'vue';
import { common } from '@prismicio/vue/components';

Object.entries(common).forEach(([_, c]) => {
  Vue.component(c.name, c);
});

Vue.prototype.$endpoint = 'https://repo.prismic.io/api/v2';

Vue.prototype.$prismic = {
  linkResolver() {},
  asText(richText) {
    return richText && Array.isArray(richText) && richText[0]
      ? richText[0].text
      : '';
  },
};
