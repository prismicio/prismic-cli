import {{componentName}} from './';
import mock from './mock.json'

export default {
  title: '{{componentName}}'
};

export const __DefaultSlice = () => ({
  components: { {{componentName}} },
  data() {
    return {
      mock
    }
  },
  template: '<{{componentName}} :slice="mock" />'
});
