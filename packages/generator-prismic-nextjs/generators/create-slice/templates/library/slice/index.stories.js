import MyComponent from './<%- pathToComponentFromStory %>';

export default {
  title: '<%- componentTitle %>'
}

<% mocks.forEach((variation) => { %>
export const <%- variation.id %> = () => <MyComponent slice={<%- JSON.stringify(variation) %>} />
<%- variation.id %>.storyName = '<%- variation.name %>'
<% }) %>
 