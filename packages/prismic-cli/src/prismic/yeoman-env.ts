import {createEnv, GeneratorMeta} from 'yeoman-environment'

const env = createEnv()

export const all = env.lookup({
  packagePatterns: ['generator-prismic-*'],
})

export const names = env.getGeneratorNames() // names of the generators

export const meta = env.getGeneratorsMeta() // local first logic

function filterFor(generatorsMeta: Record<string, GeneratorMeta>, end: string): Record<string, GeneratorMeta> {
  return Object.entries(generatorsMeta)
  .reduce<Record<string, GeneratorMeta>>((acc, [key, value]) => {
    if (key.endsWith(`:${end}`)) {
      return {...acc, [key]: value}
    }
    return acc
  }, {})
}

export const apps = filterFor(meta, 'app')

export const hasCreateSlice = filterFor(meta, 'create-slice')

export const hasSliceMachine = filterFor(meta, 'slicemachine')

export const hasStorybook = filterFor(meta, 'storybook')

export default env

// console.log({all, names, meta, apps})

