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
})
