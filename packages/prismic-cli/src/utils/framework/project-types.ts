export enum ProjectType {
  NUXT = 'nuxt',
  NEXT = 'next',
  VUE = 'vue.js',
  REACT = 'react',
  SVELTE = 'svelte',
  GATSBY = 'gatsby',
  NODE = 'node',
}

export function findProjectType(strFramework: string): ProjectType | null {
  switch (strFramework.toLowerCase()) {
  case ProjectType.NUXT: return ProjectType.NUXT
  case ProjectType.NEXT: return ProjectType.NEXT
  case ProjectType.VUE: return ProjectType.VUE
  case ProjectType.REACT: return ProjectType.REACT
  case ProjectType.SVELTE: return ProjectType.SVELTE
  case ProjectType.GATSBY: return ProjectType.GATSBY
  case ProjectType.NODE: return ProjectType.NODE
  default: return null
  }
}

export interface Framework {
  preset: ProjectType;
  dependencies?: ReadonlyArray<string>;
  peerDependencies?: ReadonlyArray<string>;
  files?: ReadonlyArray<File>;
  matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => boolean;
}
/*
 * This has to be an array sorted in order of specificity/priority.
 * Reason: both REACT and WEBPACK_REACT have react as dependency,
 * therefore WEBPACK_REACT has to come first, as it's more specific.
 */
export const supportedProjects: ReadonlyArray<Framework> = [
  {
    preset: ProjectType.NUXT,
    dependencies: ['nuxt'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.some(Boolean),
  },
  {
    preset: ProjectType.NEXT,
    dependencies: ['next'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.some(Boolean),
  },
  {
    preset: ProjectType.VUE,
    dependencies: ['vue'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.some(Boolean),
  },
  {
    preset: ProjectType.REACT,
    dependencies: ['react'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.every(Boolean),
  },
  {
    preset: ProjectType.SVELTE,
    dependencies: ['svelte'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.every(Boolean),
  },
  {
    preset: ProjectType.GATSBY,
    dependencies: ['gatsby'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.every(Boolean),
  },
  {
    preset: ProjectType.NODE,
    dependencies: ['express', 'koa'],
    matcherFunction: ({dependencies}: { dependencies: ReadonlyArray<unknown> }) => dependencies.every(Boolean),
  },
]
