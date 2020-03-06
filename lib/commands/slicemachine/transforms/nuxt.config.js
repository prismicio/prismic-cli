const fs = require('fs')
const template = require('@babel/template').default
const transform = require('@babel/standalone').transform
// const babelPluginTransformJsx = require('@babel/plugin-transform-react-jsx')
const babelPluginSyntaxJsx = require('@babel/plugin-syntax-jsx')

const transformPlugins = [
  babelPluginSyntaxJsx
]

const code = fs.readFileSync('./nuxt.config.js', 'utf8')

const ast = template.ast(code);

const finds = [{
  type: 'Identifier',
  name: 'css',
  next: {
    type: 'ArrayExpression',
    action: (elem) => {
      console.log('next elem;', elem)
      return {
        ...elem,
        value: {
          ...elem.value,
          elements: [...elem.value.elements, {
            type: 'StringLiteral',
            value: 'vue-essential-slices/src/styles/styles.scss'
          }]
        }
      }
    }
  }
}]

// console.log(ast, typeof ast)
const defaultDeclaration = ast.type === 'ExportDefaultDeclaration' ? ast.declaration : null

if (!defaultDeclaration) {
  console.error('Could not find default declaration')
}

defaultDeclaration.properties.forEach((declaration, i) => {
  // console.log(declaration.key, declaration.value)
  const find = finds[0]
  if (declaration.key.type === find.type && declaration.key.name === find.name) {
    console.log('sort of matched')
    let maybeNext = defaultDeclaration.properties[i + 1]
    if (maybeNext) {
      maybeNext = find.next.action(maybeNext)
      console.log('new maybeNext', maybeNext.value)
    }
  }
})
const newCode = transform(code, {
  plugins: [
    ...transformPlugins
  ]
}).code

// console.log(newCode)

// module.exports = () => {
//   const ast = template.ast(code);

//   console.log(ast)

//   const newCode = transform(code, {
//     plugins: [
//       ...transformPlugins
//     ]
//   }).code

//   console.log(newCode)
// }
