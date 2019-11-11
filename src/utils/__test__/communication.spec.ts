import Communication from '../communication'

const base = 'https://prismic.io'
const url = (repository: string) => `${base}/app/dashboard/repositories/${repository}/exists`

describe('utils/communication', () => {
  describe('get()', () => {
    it('should return true if "my-abcd-repo" it doens\'t exist', async () => {
      const result = await Communication.get(url('my-ab-c-d-repo'))
      expect(result).toBe(true)
    })

    it('should return false if "iwatakeshi" exists', async () => {
      const result = await Communication.get(url('iwatakeshi'))
      expect(result).toBe(false)
    })
  })

  describe('post()', () => {
    it('should perform a post action', () => {
      if (process.env.EMAIL && process.env.PASSWORD) {
        return expect(Communication.post('https://prismic.io/authentication/signin', {
          email: process.env.EMAIL,
          password: process.env.PASSWORD
        })).resolves.not.toBeUndefined()
      } else {
        // tslint:disable-next-line: no-console
        console.warn('[skipped]: should perform a post action without errors')
      }
    })

    it('should throw an error on an invalid post action', () => {
      return expect(Communication.post('https://prismic.io/authentication/signin', {
        email: 'john.doe123@example.com',
        password: '12345678'
      })).rejects.toThrow()
    })
  })
})
