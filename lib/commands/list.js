import Helpers from '../helpers';
import Template from './template';

export default async function () {
  Helpers.UI.display('Available templates:');
  const templates = await Helpers.Prismic.templates();
  Helpers.UI.display(Template.getDisplayed(templates).map(template => `* ${template.name}`));
}
