
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import generate from '@babel/generator'

import * as npath from 'path'

function getKeys(properties: Array<t.ObjectMethod | t.ObjectProperty | t.SpreadElement>): Array<string> {
  return properties.reduce<Array<string>>((acc, curr) => {
    if (t.isObjectProperty(curr) && t.isIdentifier(curr.key)) {
      return [...acc, curr.key.name]
    }
    return acc
  }, [])
}

export default function modifyNuxtConfig(source: string, libraryNames: Array<string>): string {
  const ast = parser.parse(source, {sourceType: 'module'})

  const pathString = (libPath: string) => npath.posix.join('~', libPath, '**', '*.stories.[tj]s')

  const toCustomSlicePath = (libName: string) => t.stringLiteral(pathString(libName))
  const toGeneratedSlicePath = (libName: string) => t.stringLiteral(pathString(npath.posix.join('.slicemachine', 'assets', libName)))
  const pathsToSlices = libraryNames.reduce<Array<t.StringLiteral>>((acc, libraryName) => {
    return acc.concat([
      toCustomSlicePath(libraryName),
      toGeneratedSlicePath(libraryName)
    ])
  }, [])

  traverse(ast, {
    ObjectExpression(path) {
      if (t.isObjectExpression(path) && t.isExportDeclaration(path.parent)) {
        const keys = getKeys(path.node.properties)
        const hasStorybook = keys.includes('storybook')
        const hasIgnore = keys.includes('ignore')

        if (hasStorybook === false) {
          path.node.properties.push(
            t.objectProperty(
              t.identifier('storybook'),
              t.objectExpression([
                t.objectProperty(
                  t.identifier('stories'),
                  t.arrayExpression(pathsToSlices)
                ),
              ])
            )
          )
        } else {
          path.node.properties.forEach((prop: t.ObjectMethod | t.ObjectProperty | t.SpreadElement) => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isObjectExpression(prop.value) && prop.key.name === 'storybook') {
              const storybookKeys = getKeys(prop.value.properties)
              const hasStories = storybookKeys.includes('stories')
              if (hasStories === false) {
                prop.value.properties.push(
                  t.objectProperty(
                    t.identifier('stories'),
                    t.arrayExpression(pathsToSlices)
                  )
                )
              } else {
                // TODO: how would this handle deletions
                prop.value.properties.forEach((storyBookProps: t.ObjectMethod | t.ObjectProperty | t.SpreadElement) => {
                  if (t.isObjectProperty(storyBookProps) && t.isIdentifier(storyBookProps.key) && t.isArrayExpression(storyBookProps.value) && storyBookProps.key.name === 'stories') {
                    const values = storyBookProps.value.elements.reduce<Array<string>>((acc, curr) => {
                      if (t.isStringLiteral(curr)) return [...acc, curr.value]
                      return acc
                    }, [])

                    libraryNames.forEach(lib => {
                      if (values.includes(pathString(lib)) === false && t.isArrayExpression(storyBookProps.value)) {
                        storyBookProps.value.elements.push(toCustomSlicePath(lib))
                        storyBookProps.value.elements.push(toGeneratedSlicePath(lib))
                      }
                    })
                  }
                })
              }
            }
          })
        }
        if (hasIgnore === false) {
          path.node.properties.push(
            t.objectProperty(
              t.identifier('ignore'),
              t.arrayExpression([
                t.stringLiteral('**/*.stories.js'),
              ])
            )
          )
        } else {
          path.node.properties.forEach(prop => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isArrayExpression(prop.value) && prop.key.name === 'ignore') {
              const values = prop.value.elements.reduce<Array<string>>((acc, curr) => {
                if (t.isStringLiteral(curr)) return [...acc, curr.value]
                return acc
              }, [])
              if (values.includes('**/*.stories.js') === false) {
                prop.value.elements.push(t.stringLiteral('**/*.stories.js'))
              }
            }
          })
        }
      }
    },
  })

  const {code} = generate(ast, { /* config */ }, source)

  return code
}
