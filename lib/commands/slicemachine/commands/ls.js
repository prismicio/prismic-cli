import fs from 'fs'
import shell from 'shelljs'
import path from 'path'
import consola from 'consola'
import globby from 'globby'

import {
  fromPath as getLibraryInfoFromPath
} from '../methods/libraryInfo'

import {
  get as getSmFile
} from '../methods/sm'

function getSliceNameFromPath(slicePath) {
  const split = slicePath.split('/')
  const pop = split.pop()
  if (pop.indexOf('index.') === 0) {
    return split.pop()
  }
  if (pop.indexOf(split[split.length - 1]) === 0) {
    return slicePath.pop()
  }
  return pop.split('.')[0]
}

const emojis = ["🥒", "🍕", "⚾️", "🏀"];
function displayLibs(libs) {
  const count = libs.reduce((acc, [_, s]) => acc + s.length, 0)
  consola.info(`Found ${count} slices across ${libs.length} libraries:`)
  libs.filter(([_, s]) => s.length).forEach(([lib, sliceNames], i) => {
    console.log(`\n${emojis[i] || "🌸"} at ${lib}:`);
    sliceNames.forEach((slice) => console.log(`  * ${slice}`))
  })
  console.log('')
  consola.info(`Something's missing?\nCheck paths in your configuration file!\n`)
}

async function ls() {
  try {
    const sm = getSmFile()
    if (!sm) {
      return consola.error('sm file not found.\nExiting...')
    }
    if (!sm.libraries) {
      return consola.error('sm file should have a "libraries" field, filled with paths to SM libs')
    }
    if (!sm.libraries.length || !Array.isArray(sm.libraries)) {
      return consola.error('empty or malformed "libraries" field')
    }
    const expandedLibs = await Promise.all(
      sm.libraries.map(async (libPath) => {
        try {
          const { pathToSlices } = getLibraryInfoFromPath(libPath);
          const expandedPaths = await globby([
            `${pathToSlices}/**/index.js`,
            `${pathToSlices}/**/index.vue`,
            `${pathToSlices}/*.vue`,
            `${pathToSlices}/*.js`,
            `!${pathToSlices}/index.js`,
          ]);
          const sliceNames = expandedPaths.map(e => getSliceNameFromPath(e))
          return [libPath, sliceNames]
        } catch(e) {
          console.error(e)
        }
      })
    )

    displayLibs(expandedLibs)

  } catch (e) {
    consola.error(e)
  }
}

export { ls }
