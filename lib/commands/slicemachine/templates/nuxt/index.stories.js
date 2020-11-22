import SliceZone from 'vue-slicezone'
import model from './model'
import mocks from './mocks.json'
import Slice from './'

export default {
  title: model.name,
}

// TODO: Update to loop over mocks.json
export const DefaultSlice = () => ({
  components: {
    Slice,
    SliceZone,
  },
  data() {
    return {
      mock: mocks[0],
      resolver() {
        return Slice
      },
    }
  },
  template: '<slice-zone :slices="[ mock ]" :resolver="resolver" />',
})

DefaultSlice.storyName = mocks[0].name
