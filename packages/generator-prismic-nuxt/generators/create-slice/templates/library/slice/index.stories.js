import MyComponent from './<%- pathToComponentFromStory %>';
import SliceZone from 'vue-slicezone'

export default {
  title: '<%- componentTitle %>'
}

<% mocks.forEach((variation) => { %>
export const <%- variation.id %> = () => ({
  components: {
    MyComponent,
    SliceZone
  },
  methods: {
    resolve() {
      return MyComponent
    }
  },
  data() {
    return {
      mock: <%- JSON.stringify(variation) %>
    }
  },
  template: '<SliceZone :slices="[mock]" :resolver="resolve" />'
})
<%- variation.id %>.storyName = '<%- variation.name %>'
<% }) %>