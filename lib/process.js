const protocol = {
  projectName: 'Nuxt',
  customTypesToMerge: ['page'],
  projectTests: [{
    arg: '-f',
    path: 'nuxt.config.js',
    reason: 'No `nuxt.config.js` file found',
  }, {
    arg: '-d',
    path: 'pages',
    reason: 'No `pages` folder found',
  }],
  bootstraper: ['npx', ['create-nuxt-app']],
  actions: [{
    type: 'write',
    folder: false,
    zipPath: 'prismic.cinfig.js',
    writePath: 'prismic.config.js',
    overwrite: false,
  }, {
    type: 'write',
    folder: true,
    pathname: 'prismic.config.js',
    overwrite: true,
  }],
  dependencies: ['https://github.com/prismicio/prismic-vue.git#nuxt', 'prismic-javascript'],
  devDependencies: ['node-sass', 'sass-loader'],
  onAfter: () => console.log('End of the process!'),
};

protocol.onBefore({ new: true });


// shell.cp('-r', `${__dirname}/custom_types`, projectPath);
// shell.ShellString(createPrismicConfigurationFile(base, domain)).to(path.join(projectPath, 'prismic.config.js'));
// shell.ShellString(createLinkResolverPluginFile()).to(path.join(projectPath, 'plugins', LINK_RESOLVER_FILENAME));
// shell.ShellString(createPrismicVuePluginFile(LINK_RESOLVER_FILENAME)).to(path.join(projectPath, 'plugins', PRISMIC_VUE_PLUGIN));
