import {expect} from 'chai'
import addGetStoriesPaths, {ensureImport, addStories} from '../../generators/storybook/add-get-stories-paths'

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
  const expectedCode = '...getStoriesPaths().map(path => path.replace("../", "~/"))'

  describe('upsertStories', () => {
    it(`should add { stories: ${expectedCode} } when no storybook property is found`, () => {
      const input = 'export default {}'
      const result = addStories(input)
      const wanted =
`export default {
  storybook: {
    stories: [${expectedCode}]
  }
};`
      expect(result).to.equal(wanted)
    })

    it(`should add a { stories : ${expectedCode} } when storybook property is found`, () => {
      const input = 'export default {\n  storybook: {}\n}'
      const result = addStories(input)
      const wanted =
`export default {
  storybook: {
    stories: [${expectedCode}]
  }
};`
      expect(result).to.equal(wanted)
    })

    it(`should add ${expectedCode} to the stories array`, () => {
      const input = `export default {
        storybook: {
          stories: ["foo"]
        },
      }`
      const wanted =
`export default {
  storybook: {
    stories: ["foo", ${expectedCode}]
  }
};`

      const result = addStories(input)

      expect(result).to.equal(wanted)
    })

    it(`should not add ${expectedCode} if it is already in the array`, () => {
      const wanted =
`export default {
  storybook: {
    stories: [${expectedCode}]
  }
};`
      const result = addStories(wanted)
      expect(wanted).equal(result)
    })

    it('should update the old ...getStoriesPath', () => {
      const input = 'export default {\n  storybook: {\n    stories: [...getStoriesPaths()]\n  }\n};'
      const wanted =
`export default {
  storybook: {
    stories: [${expectedCode}]
  }
};`
      const result = addStories(input)
      expect(result).equal(wanted)
    })
  })

  it('should add import and stories to export default {}', () => {
    const input = 'export default {};'
    const wanted =
`import { getStoriesPaths } from 'slice-machine-ui/helpers/storybook';
export default {
  storybook: {
    stories: [${expectedCode}]
  }
};`
    const result = addGetStoriesPaths(input)

    expect(result).to.equal(wanted)
  })

  it('should add import and stories to export default { storybook: {}}', () => {
    const input = 'export default { storybook: {}};'
    const wanted =
`import { getStoriesPaths } from 'slice-machine-ui/helpers/storybook';
export default {
  storybook: {
    stories: [${expectedCode}]
  }
};`
    const result = addGetStoriesPaths(input)

    expect(result).to.equal(wanted)
  })

  it('should add import and stories to export default { storybook: { stories: ["foo"]}}', () => {
    const input = 'export default { storybook: { stories: ["foo"]}};'
    const wanted =
`import { getStoriesPaths } from 'slice-machine-ui/helpers/storybook';
export default {
  storybook: {
    stories: ["foo", ${expectedCode}]
  }
};`
    const result = addGetStoriesPaths(input)

    expect(result).to.equal(wanted)
  })

  it('should not add any duplicates', () => {
    const input =
`import { getStoriesPaths } from 'slice-machine-ui/helpers/storybook';
export default {
  storybook: {
    stories: ["foo", ${expectedCode}]
  }
};`
    const result = addGetStoriesPaths(input)

    expect(result).to.equal(input)
  })
})
