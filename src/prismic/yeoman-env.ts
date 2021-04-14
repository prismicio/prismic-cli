import {createEnv} from 'yeoman-environment'

const env = createEnv()

env.register(
  require.resolve('../generators/NextJS'),
  'Next',
)

env.register(
  require.resolve('../generators/Nuxt'),
  'Nuxt',
)

env.register(
  require.resolve('../generators/React'),
  'React',
)

env.register(
  require.resolve('../generators/Vue'),
  'VueJS',
)

env.register(
  require.resolve('../generators/Angular2'),
  'Angular2',
)

env.register(
  require.resolve('../generators/NodeJS'), // make this dynamic?
  'NodeJS', // make this dynamic?
)

export default env
