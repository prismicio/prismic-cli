import * as error from '../error'

describe('utils/error', () => {
  describe('PrismicError', () => {
    it('should return an error with a prefix [Prismic Error]', () => {
      const e = new error.PrismicError('message')
      expect(e.message).toBe('[Prismic Error]: message')
      expect(e.status).toBe(-1)
    })
  })

  describe('BadRequestError', () => {
    it('should return an error with a prefix [Bad Request Error]', () => {
      const e = new error.BadRequestError('message')
      expect(e.message).toBe('[Bad Request Error]: message')
      expect(e.status).toBe(400)
    })
  })

  describe('UnauthorizedError', () => {
    it('should return an error with a prefix [Unauthorized Error]', () => {
      const e = new error.UnauthorizedError('message')
      expect(e.message).toBe('[Unauthorized Error]: message')
      expect(e.status).toBe(401)
    })
  })

  describe('ForbiddenError', () => {
    it('should return an error with a prefix [Forbidden Error]', () => {
      const e = new error.ForbiddenError('message')
      expect(e.message).toBe('[Forbidden Error]: message')
      expect(e.status).toBe(403)
    })
  })

  describe('InternalServerError', () => {
    it('should return an error with a prefix [Internal Server Error]', () => {
      const e = new error.InternalServerError('message')
      expect(e.message).toBe('[Internal Server Error]: message')
      expect(e.status).toBe(500)
    })
  })

  describe('UnknownError', () => {
    it('should return an error with a prefix [Unknown Error]', () => {
      const e = new error.UnknownError('message')
      expect(e.message).toBe('[Unknown Error]: message')
      expect(e.status).toBe(-1)
    })
  })
})
