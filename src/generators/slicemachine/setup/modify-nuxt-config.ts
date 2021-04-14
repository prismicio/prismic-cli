import * as parser from '@babel/parser'
import {default as traverse, NodePath} from '@babel/traverse'
import * as t from '@babel/types'
import generate from '@babel/generator'

function getKeys(properties: Array<t.ObjectMethod | t.ObjectProperty | t.SpreadElement>): Array<string> {
  return properties.reduce<Array<string>>((acc, curr) => {
    if (t.isObjectProperty(curr) && t.isIdentifier(curr.key)) {
      return [...acc, curr.key.name]
    }
    return acc
  }, [])
}

export default function modifyNuxtConfig(source: string, domain: string): string {
  const ast = parser.parse(source, {sourceType: 'module'})

  const srcPollyFill = t.objectExpression([t.objectProperty(t.identifier('src'), t.stringLiteral('https://cdn.polyfill.io/v2/polyfill.min.js?features=Element.prototype.classList'))])

  const srcFocusVisible = t.objectExpression([t.objectProperty(t.identifier('src'), t.stringLiteral('https://cdn.jsdelivr.net/npm/focus-visible@5.0.2/dist/focus-visible.min.js'))])

  const css = t.stringLiteral('vue-essential-slices/src/styles/styles.scss')

  const modulesToTranspile = t.arrayExpression([
    t.stringLiteral('vue-slicezone'),
    t.stringLiteral('nuxt-sm'),
  ])

  const transpile = t.objectProperty(t.identifier('transpile'), modulesToTranspile)

  const modules = t.arrayExpression([
    t.stringLiteral('@nuxtjs/prismic'),
    t.objectExpression([
      t.objectProperty(
        t.identifier('endpoint'),
        t.stringLiteral(`https://${domain}.cdn.prismic.io/api/v2`)),
      t.objectProperty(
        t.identifier('apiOptions'),
        t.objectExpression([
          t.objectProperty(
            t.identifier('routes'),
            t.arrayExpression([
              t.objectExpression([
                t.objectProperty(
                  t.identifier('type'),
                  t.stringLiteral('page'),
                ),
                t.objectProperty(
                  t.identifier('path'),
                  t.stringLiteral('/:uid'),
                ),
              ]),
            ]),
          ),
        ]),
      ),
    ]),
  ])

  traverse(ast, {
    ObjectExpression(path: NodePath<t.ObjectExpression>) {
      path.node.properties.forEach((prop: t.ObjectMethod | t.ObjectProperty | t.SpreadElement) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isObjectExpression(prop.value) && prop.key.name === 'head') {
          const keys = getKeys(prop.value.properties)
          const hasScript = keys.includes('script')

          if (hasScript === false) {
            return prop.value.properties.push(t.objectProperty(t.identifier('script'),  t.arrayExpression([
              srcPollyFill,
              srcFocusVisible,
            ])))
          }
          return prop.value.properties.forEach(headProp => {
            if (t.isObjectProperty(headProp) && t.isIdentifier(headProp.key) && t.isArrayExpression(headProp.value) && headProp.key.name === 'script') {
              headProp.value.elements.push(srcPollyFill, srcFocusVisible)
            }
          })
        }

        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isArrayExpression(prop.value) && prop.key.name === 'css') {
          return prop.value.elements.push(css)
        }

        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isArrayExpression(prop.value) && prop.key.name === 'modules') {
          return prop.value.elements.push(modules)
        }

        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isObjectExpression(prop.value) && prop.key.name === 'build') {
          const keys = getKeys(prop.value.properties)
          const hasTranspile = keys.includes('transpile')
          if (hasTranspile === false) {
            return prop.value.properties.push(transpile)
          }
          return prop.value.properties.forEach(buildProp => {
            if (t.isObjectProperty(buildProp) && t.isIdentifier(buildProp.key) && t.isArrayExpression(buildProp.value) &&  buildProp.key.name === 'transpile') {
              buildProp.value.elements.push(modulesToTranspile)
            }
          })
        }
      })
    },
  })

  const {code} = generate(ast, { /* config */ }, source)

  return code
}
