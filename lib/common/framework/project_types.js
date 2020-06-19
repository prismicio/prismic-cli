export const ProjectType = {
  REACT: 'NUXT',
  VUE: 'VUE',
  NEXT: 'NEXT',
  REACT: 'REACT',
  SVELTE: 'SVELTE',
};

/*
 * Configuration to match a storybook preset template.
 *
 * This has to be an array sorted in order of specificity/priority.
 * Reason: both REACT and WEBPACK_REACT have react as dependency,
 * therefore WEBPACK_REACT has to come first, as it's more specific.
 */
export const supportedProjects = [
  {
    preset: ProjectType.NUXT,
    dependencies: ['nuxt'],
    matcherFunction: ({ dependencies }) => dependencies.some(Boolean),
  },
  {
    preset: ProjectType.VUE,
    dependencies: ['vue'],
    matcherFunction: ({ dependencies }) => dependencies.some(Boolean),
  },
  {
    preset: ProjectType.NEXT,
    dependencies: ['next'],
    matcherFunction: ({ dependencies }) => dependencies.some(Boolean),
  },
  {
    preset: ProjectType.REACT,
    dependencies: ['react'],
    matcherFunction: ({ dependencies }) => dependencies.every(Boolean),
  },
  {
    preset: ProjectType.SVELTE,
    dependencies: ['svelte'],
    matcherFunction: ({ dependencies }) => dependencies.every(Boolean),
  },
];
