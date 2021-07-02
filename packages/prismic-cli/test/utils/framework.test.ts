import {test, expect} from '@oclif/test'
import {detect, parse, PkgJson} from '../../src/utils/framework'
import {ProjectType} from '../../src/utils/framework/project-types'

describe('utils/framework', () => {
  test.it('#parse', () => {
    expect(parse('NUXT')).equal('nuxt')
    expect(parse('Next')).equal('next')
    expect(parse('Vue.js')).equal('vue.js')
    expect(parse('react')).equal('react')
    expect(parse('svelte')).equal('svelte')
    expect(parse('gatsby')).equal('gatsby')
    expect(parse('node')).equal('node')
    expect(parse('go')).equal(null)
  })

  test.it('#detect', () => {
    const nuxt: PkgJson = {dependencies: {nuxt: '1'}}
    expect(detect(nuxt)).equal(ProjectType.NUXT)

    expect(detect({dependencies: {lodash: '1'}})).to.be.null

    expect(detect({
      devDependencies: {},
      dependencies: {},
      peerDependencies: {},
    })).to.be.null

    expect(detect({devDependencies: {next: '1'}})).equal(ProjectType.NEXT)
  })
})
