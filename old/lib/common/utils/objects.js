import deepEqual from 'deep-equal';

const _defaults = {
  find: (key, [id]) => id === key,
};

export default {
  matchIn(toMatchObj, dataset) {
    if (!toMatchObj) return [];

    return Object.entries(toMatchObj).reduce(([miss, diff, equals], [key, value]) => {
      const item = dataset[key];
      if (item) {
        if (deepEqual(item, value)) return [miss, diff, { ...equals, [key]: value }];
        return [miss, { ...diff, [key]: { before: item, after: value } }, equals];
      }
      return [{ ...miss, [key]: value }, diff, equals];
    }, []);
  },

  find(key, objcts) {
    if (!key || !objcts) return {};

    return function exec(customFind = _defaults.find) {
      const found = Object.entries(objcts).find(([id, value]) => customFind(key, [id, value]));
      if (!found) return {};

      return { [found[0]]: found[1] };
    };
  },

  filter(objct, filterFn) {
    return Object.entries(objct)
      .filter(filterFn)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  },

  partition(objct, predicateFn) {
    return Object.entries(objct)
      .reduce((acc, [k, v]) => {
        const isSelected = predicateFn([k, v]);

        const item = { [k]: v };
        if (isSelected) return [{ ...acc[0], ...item }, acc[1]];
        return [acc[0], { ...acc[1], ...item }];
      }, [{}, {}]);
  },

  isEmpty(objct) {
    return !objct || Object.keys(objct).length === 0;
  },

  nonEmpty(objct) {
    return !this.isEmpty(objct);
  },

  map(obj, transformFn) {
    return Object.entries(obj)
      .map(transformFn)
      .reduce((acc, value) => ({ ...acc, ...value }), {});
  },
};
