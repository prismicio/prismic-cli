import {test, expect} from '@oclif/test'
import {LocalDB} from '../../src/prismic/base-class'
import * as sinon from 'sinon'

import {
  parseJson,
  parseJsonSync,
} from '../../src/utils'

describe('utils', () => {
  describe('parseJson', () => {
    test.it('it should return a promise and the parsed json', async () => {
      const str = JSON.stringify({base: 'https://prismic.io', cookies: ''})
      const result = await parseJson<LocalDB>(str)
      expect(result.base).to.equal('https://prismic.io')
      expect(result.cookies).to.equal('')
    })

    test.it('it should throw an error if failed', async () => {
      const str = 'https://prismic.io'
      const catchFn = sinon.fake()
      await parseJson(str).catch(catchFn)
      expect(catchFn.called).to.be.true
    })
  })
  describe('parseJsonSync', () => {
    test.it('when given json it should return an object', () => {
      const str = JSON.stringify({base: 'https://prismic.io', cookies: ''})
      const result = parseJsonSync<LocalDB>(str)
      expect(result.base).to.equal('https://prismic.io')
      expect(result.cookies).to.equal('')
    })

    test.it('should throw an error if it can not parse', () => {
      const str = 'https://prismic.io'
      expect(()  => parseJsonSync<LocalDB>(str)).to.throw()
    })
  })
})
