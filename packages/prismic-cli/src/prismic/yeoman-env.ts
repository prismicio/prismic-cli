/* eslint-disable unicorn/no-abusive-eslint-disable, @typescript-eslint/ban-ts-ignore */

import {createEnv, GeneratorMeta} from 'yeoman-environment'

const env = createEnv()

export const all = env.lookup({
  // @ts-ignore
  lookups: ['generators'],
  packagePatterns: ['generator-prismic-*'],
})

export const names = env.getGeneratorNames() // names of the generators

export const meta = env.getGeneratorsMeta() // local first logic

export function filterMetaFor(generatorsMeta: Record<string, GeneratorMeta>, subGeneratorName: string): Record<string, GeneratorMeta> {
  return Object.entries(generatorsMeta)
  .reduce<Record<string, GeneratorMeta>>((acc, [key, value]) => {
    if (key.endsWith(`:${subGeneratorName}`)) {
      return {...acc, [key]: value}
    }
    return acc
  }, {})
}

export const apps = filterMetaFor(meta, 'app')

export default env
