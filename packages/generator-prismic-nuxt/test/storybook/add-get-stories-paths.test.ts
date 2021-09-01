import {expect} from 'chai'
import {ensureImport, upsertStories} from '../../add-get-stories-paths'

describe('add-get-stories-paths', () => {
  describe('#ensureImport', () => {
    const statement = 'import { getStoriesPaths } from \'slice-machine-ui/helpers/storybook\''

    it(`should append ${statement} to the start of an empty string`, () => {
      const input = ''
      const result = ensureImport(input)
      expect(result).to.contain('import { getStoriesPaths } from \'slice-machine-ui/helpers/storybook')
    })

    it(`should append ${statement} before the export`, () => {
      const input = 'export default {}'
      const result = ensureImport(input)
      expect(result).to.contain(statement)
      expect(result.indexOf(statement)).to.equal(0)
    })

    it(`should not add ${statement} it it is already there`, () => {
      const input = `${statement};\nexport default {};`
      const result = ensureImport(input)
      expect(result).to.equal(input)
    })
  })

  describe('upsertStories', () => {

    it('should add a { storybook: { stories: [ ...getStoriesPaths() ] } } when no storybook property is found', () => {
      const input = 'export default {}'
      const result = upsertStories(input)
      expect(result).to.equal("export default {\n  storybook: {\n    stories: [...getStoriesPaths()]\n  }\n};")
    })

    it('should add a { stories :[ ...getStoriesPaths() ] } when storybook property is found', () => {
      const input = 'export default {\n  storybook: {}\n}'
      const result = upsertStories(input)
      expect(result).to.equal("export default {\n  storybook: {\n    stories: [...getStoriesPaths()]\n  }\n};")
    })

    it('should add ...getStoriesPaths() to the stories array', () => {
      const input = `export default {
        storybook: {
          stories: ["foo"]
        },
      }`
      const expected = 'export default {\n  storybook: {\n    stories: ["foo", ...getStoriesPaths()]\n  }\n};'

      const result = upsertStories(input)

      expect(result).to.equal(expected)
    })
  })

  it('should not add ...getStoriesPaths() if it is already in the array', () => {
    const input = "export default {\n  storybook: {\n    stories: [...getStoriesPaths()]\n  }\n};"
    const result = upsertStories(input)
    expect(input).equal(result)
  }) 
})
