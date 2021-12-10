import * as babel from '@babel/core'
import * as t from '@babel/types'

function ensureImportPlugin(): babel.PluginObj {
  const importStatment = 'import { getStoriesPaths } from \'slice-machine-ui/helpers/storybook\''
  const importAst = babel.template.ast(importStatment, {sourceType: 'module'})

  return {
    visitor: {
      Program(path /* , state */) {
        const shouldImport = path.get('body').reduce((acc, elem) => {
          if (acc === false) return acc

          if (elem.isImportDeclaration() && t.isImportDeclaration(importAst) && elem.node.source.value === importAst.source.value) return false

          return acc
        }, true)

        if (shouldImport) path.unshiftContainer('body', importAst)
      },
    },
  }
}

export function ensureImport(source: string): string {
  const result = babel.transform(source, {plugins: [ensureImportPlugin]})
  return result?.code || source
}

function getKeys(properties: Array<babel.types.ObjectMethod | babel.types.ObjectProperty | babel.types.SpreadElement>): Array<string> {
  return properties.reduce<Array<string>>((acc, curr) => {
    if (t.isObjectProperty(curr) && t.isIdentifier(curr.key)) {
      return [...acc, curr.key.name]
    }
    return acc
  }, [])
}

function addStoriesPlugin(): babel.PluginObj {
  return {
    visitor: {
      ObjectExpression(path) {
        const elementToInsert = t.spreadElement(t.callExpression(
          t.memberExpression(
            t.callExpression(t.identifier('getStoriesPaths'), []),
            t.identifier('map'),
          ),
          [
            t.arrowFunctionExpression(
              [t.identifier('path')],
              t.callExpression(
                t.memberExpression(
                  t.identifier('path'),
                  t.identifier('replace'),
                ),
                [
                  t.stringLiteral('../'),
                  t.stringLiteral('~/'),
                ],
              ),
            ),
          ],
        ))

        if (t.isObjectExpression(path) && t.isExportDeclaration(path.parent)) {
          const keys = getKeys(path.node.properties)
          const hasStorybook = keys.includes('storybook')

          if (hasStorybook === false) {
            path.node.properties.push(
              t.objectProperty(
                t.identifier('storybook'),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('stories'),
                    t.arrayExpression([elementToInsert]),
                  ),
                ]),
              ),
            )
          } else {
            path.node.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isObjectExpression(prop.value) && prop.key.name === 'storybook') {
                const storybookKeys = getKeys(prop.value.properties)
                const hasStories = storybookKeys.includes('stories')
                if (hasStories === false) {
                  prop.value.properties.push(
                    t.objectProperty(
                      t.identifier('stories'),
                      t.arrayExpression([elementToInsert]),
                    ),
                  )
                } else {
                  prop.value.properties.forEach(storyBookProps => {
                    if (t.isObjectProperty(storyBookProps) && t.isIdentifier(storyBookProps.key) && t.isArrayExpression(storyBookProps.value) && storyBookProps.key.name === 'stories') {
                      // clean up old getStoriesPaths
                      storyBookProps.value.elements.forEach((elem, i, arr) => {
                        if (
                          t.isSpreadElement(elem) &&
                          t.isCallExpression(elem.argument) &&
                          t.isIdentifier(elem.argument.callee) &&
                          elem.argument.callee.name === 'getStoriesPaths'
                        ) {
                          arr.splice(i, 1)
                        }
                      })

                      const maybeElementIsThere = storyBookProps.value.elements.reduce((acc, elem) => {
                        if (acc) return acc
                        const same = (
                          t.isSpreadElement(elem) &&
                          elem.type === elementToInsert.type &&
                          elem.argument &&
                          t.isCallExpression(elem.argument) &&
                          elem.argument.type === elementToInsert.argument.type &&
                          t.isMemberExpression(elem.argument.callee) &&
                          elem.argument.callee.type === elementToInsert.argument.callee.type &&
                          t.isCallExpression(elem.argument.callee.object) &&
                          elem.argument.callee.object.type === elementToInsert.argument.callee.object.type &&
                          t.isIdentifier(elem.argument.callee.object.callee) &&
                          t.isIdentifier(elementToInsert.argument.callee.object.callee) &&
                          elem.argument.callee.object.callee.name === elementToInsert.argument.callee.object.callee.name
                        )
                        return same
                      }, false)

                      if (maybeElementIsThere === false) storyBookProps.value.elements.push(elementToInsert)
                    }
                  })
                }
              }
            })
          }
        }
      },
    },
  }
}

export function addStories(source: string): string {
  const result = babel.transform(source, {plugins: [addStoriesPlugin]})
  return result?.code || source
}

export default function addGetStoriesPaths(source: string): string {
  const result = babel.transform(source, {plugins: [ensureImportPlugin, addStoriesPlugin]})
  return result?.code || source
}
