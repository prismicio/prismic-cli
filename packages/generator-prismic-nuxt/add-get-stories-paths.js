import * as babel from '@babel/core'
 
function ensureImportPlugin({/* types: t, */ template}) {
  const importStatment = 'import { getStoriesPaths } from \'slice-machine-ui/helpers/storybook\''
  const importAst = template.ast(importStatment, {sourceType: 'module'})
  return {
    visitor: {
      Program(path /* , state */) {
        const body = path.get('body')
        const imports = body.filter(p => p.isImportDeclaration())
        const same = imports.filter(p => p.node.source.value !== importAst.source.value)

        if (same.length === imports.length) path.unshiftContainer('body', importAst)
      },
    },
  }
}

export function ensureImport(source) {
  const result = babel.transform(source, {plugins: [ensureImportPlugin]})
  return result.code
}

function getKeys(t, properties) {
  return properties.reduce((acc, curr) => {
    if (t.isObjectProperty(curr) && t.isIdentifier(curr.key)) {
      return [...acc, curr.key.name]
    }
    return acc
  }, [])
}

function addStoriesPlugin({types: t}) {
  return {
    visitor: {
      ObjectExpression(path) {
        const elementToInsert = t.spreadElement(
          t.callExpression(t.identifier('getStoriesPaths'), []),
        )
        if (t.isObjectExpression(path) && t.isExportDeclaration(path.parent)) {
          const keys = getKeys(t, path.node.properties)
          const hasStorybook = keys.includes('storybook')
          // const hasIgnore = keys.includes('ignore')
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
                const storybookKeys = getKeys(t, prop.value.properties)
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
                      const maybeElementIsThere = storyBookProps.value.elements.reduce((acc, elem) => {
                        if (acc) return acc
                        const same = (
                          elem.type === elementToInsert.type &&
                          elem.argument &&
                          elem.argument.type === elementToInsert.argument.type &&
                          elem.argument.callee.type === elementToInsert.argument.callee.type &&
                          elem.argument.callee.name === elementToInsert.argument.callee.name
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

export function addStories(source) {
  const result = babel.transform(source, {plugins: [addStoriesPlugin]})
  return result.code
}

export default function addGetStoriesPaths(source) {
  const result = babel.transform(source, {plugins: [ensureImportPlugin, addStoriesPlugin]})
  return result.code
}
