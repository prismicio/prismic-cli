
export default function processSmResolver(
  file: string,
  libs: Array<{name: string; path: string}>,
) {
  const imports = libs.map(({name, path}) => `import * as ${name} from '${path}'`).join('\n')

  const spreaded = libs.map(({name}) => `...${name}`).join(',\n  ')

  const allSlices = `
const __allSlices = {
  ${spreaded}
}`

  const text = `
// HERE: auto-generated code

${imports}

${allSlices}

// END OF HERE
`

  const result = file.replace(/\/\/ HERE(.*?)END OF HERE/ms, text)

  return result
}
