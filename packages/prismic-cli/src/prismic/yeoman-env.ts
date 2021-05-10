import {createEnv, GeneratorMeta} from 'yeoman-environment'

const env = createEnv()

export const all = env.lookup({
  packagePatterns: ['generator-prismic-*'],
})

export const names = env.getGeneratorNames() // names of the generators

export const meta = env.getGeneratorsMeta() // local first logic

export const apps = Object.entries(meta).reduce<Record<string, GeneratorMeta>>((acc, [key, value]) => {
  if (key.endsWith(':app')) {
    return {...acc, [key]: value}
  }
  return acc
}, {})

export default env

console.log({all, names, meta, apps})
