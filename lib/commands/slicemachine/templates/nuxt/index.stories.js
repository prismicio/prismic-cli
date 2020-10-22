import Slice from './';
import model from './model';
import mocks from './mocks.json';
import SliceZone from 'vue-slicezone';

export default {
  title: model.name,
};

export const {{componentName}} = () => ({
  components: {
    Slice,
    SliceZone,
  },
  data() {
    return {
      mock: mocks[0],
    };
  },
  method: {
    resolver() {
      return Slice;
    },
  },
  template: '<slice-zone :slices="[ mock ]" :resolver="resolver" />',
});

Story.storyName = mocks[0].name;
