import Communication from '../communication';

const CustomTypes = {
  buildMetadata(customTypes) {
    return customTypes.map(elem => ({
      id: elem.mask_id,
      name: elem.mask_name,
      repeatable: elem.mask_repeatable,
      value: `${elem.mask_id}.json`,
    }));
  },

  async fetch(endpoint, cookies) {
    return JSON.parse(await Communication.get(endpoint, cookies));
  },

  extractSlices(customTypes) {
    return customTypes.reduce((acc, customType) => ({ ...acc, ...customType.slices }), {});
  },
};

export default CustomTypes;
