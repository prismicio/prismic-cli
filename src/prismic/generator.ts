import * as Yeoman from 'yeoman-environment'

const env: Yeoman<Yeoman.Options> = Yeoman.createEnv()

env.register(
  require.resolve('../generators/NodeJS'), // make this dynamic?
  'NodeJS', // make this dynamic?
)
env.register(
  require.resolve('../generators/React'),
  'React',
)

env.register(
  require.resolve('../generators/Angular2'),
  'Angular2',
)

env.register(
  require.resolve('../generators/Vue'),
  'VueJS',
)

export default env