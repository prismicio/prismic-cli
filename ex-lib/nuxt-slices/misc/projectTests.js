export const projectTests = {
  nuxt: [
    {
      arg: '-f',
      path: 'nuxt.config.js',
      reason: 'No `nuxt.config.js` file found',
    },
    {
      arg: '-d',
      path: 'pages',
      reason: 'No `pages` folder found',
    },
  ],
};

export const testKeys = Object.keys(projectTests);
