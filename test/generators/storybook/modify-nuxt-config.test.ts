import {expect} from '@oclif/test'

import modifyNuxtConfig from '../../../src/generators/storybook/modify-nuxt-config'


describe('storybook#modify-nuxt-config', () => {
  it('should add ignore **/*.stories.js when no ignore field is present', () => {
    const input = 'export default {}'
    const result = modifyNuxtConfig(input, 'slices')
    expect(result).to.contain('ignore: ["**/*.stories.js"]')
  })

  it('should add **/*.stories.js to ignore field', () => {
    const input = `export default {
      ignore: ["foo"]
    }`
    expect(modifyNuxtConfig(input, 'slices')).to.contain('ignore: ["foo", "**/*.stories.js"]')
  })

  it('should not add a duplicate **/*.stories.js to ignore field', () => {
    const input = `export default {
      ignore: ["**/*.stories.js"]
    }`
    expect(modifyNuxtConfig(input, 'slices')).to.contain('ignore: ["**/*.stories.js"]')
  })

  it('should add storybook.stories = ["~/slices/**/*.stories.js"] to when no storybook property is found', () => {
    const input = 'export default {}'
    expect(modifyNuxtConfig(input, 'slices')).to.contain('stories: ["~/slices/**/*.stories.js"]')
  })

  it('should add stories: ["~/slices/**/*.stories.js"] to when no storybook', () => {
    const input = `export default {
      storybook: {},
    }`
    expect(modifyNuxtConfig(input, 'slices')).to.contain('stories: ["~/slices/**/*.stories.js"]')
  })

  it('should add "~/slices/**/*.stories.js" to stories field', () => {
    const input = `export default {
      storybook: {
        stories: ["foo"]
      },
    }`
    expect(modifyNuxtConfig(input, 'slices')).to.contain('stories: ["foo", "~/slices/**/*.stories.js"]')
  })

  it('should not add duplicate entries', () => {
    const input = `export default {
      storybook: {
        stories: ["~/slices/**/*.stories.js"]
      },
    }`

    expect(modifyNuxtConfig(input, 'slices')).to.contain('stories: ["~/slices/**/*.stories.js"]')
  })
})

