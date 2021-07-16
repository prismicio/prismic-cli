import {expect} from 'chai'
import processSmResolver from '../generators/create-slice/process-sm-resolver'

describe('process-sm-resolver', () => {
  const file = `
// HERE

import * as a from './a'

const __allSlices = {
  ...a
}

// END OF HERE

const noop = () => 'This is not modified'
`
  const data = [{
    name: 'Foo',
    path: './foo',
  }, {
    name: 'Bar',
    path: './bar',
  }, {
    name: 'Baz',
    path: 'baz',
  }]

  it('should insert lice libraries in-between the string provided', () => {
    const result = processSmResolver(file, data)
    expect(result).not.to.include("import * as a from './a'")
    expect(result).to.include('import * as Foo from \'./foo\'')
    expect(result).to.include('import * as Baz from \'baz\'')
  })
})
