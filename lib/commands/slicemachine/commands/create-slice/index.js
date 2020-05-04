import fs from 'fs'
import path from 'path'

import isValidPath from 'is-valid-path'
import consola from 'consola'
import inquirer from 'inquirer'
import { ctx } from '../../../../context'
import getFramework from '../../methods/getFramework'
import { promisify } from 'util'
import cpy from 'copy-template-dir'

import { hyphenate } from 'sm-commons/utils/str'

import {
  patch as patchSmFile,
  get as getSmFile
} from '../../methods/sm'

import {
  fromPath as getLibraryInfoFromPath
} from '../../methods/libraryInfo'

const copy = promisify(cpy);

// const fs = require('fs')
// const fileSave = require('file-save')
// const glob = require('glob')
// const prompts = require('prompts')

// const createIndex = require('./methods/createIndex')
// const createMetaFile = require('./methods/createMetaFile')
// const rewriteExportFile = require('./methods/rewriteExportFile')

// // Takes PascalCase and returns kebab-case
// const hyphenateRE = /\B([A-Z])/g
// // eslint-disable-next-line
// const hyphenate = str => str.replace(hyphenateRE, '-$1').toLowerCase()

// process.on('exit', code => {
// 	if (code === 0) {
// 		// eslint-disable-next-line
//     console.log(
// 			`\n\nNew slice created! Refresh your files tree, if you can't see the new files :)\n\n`
// 		)
// 	}
// })

// const slicesFolder = './src/slices'
// const sliceReadmeTemplateSrc = './SLICE_README_TEMPLATE.md'

// const questions = [
// 	{
// 		type: 'select',
// 		name: 'framework',
// 		message: 'Which framework do you want to create the slice with?',
// 		choices: PACKAGE_TYPE
// 	},
// 	{
// 		type: 'text',
// 		name: 'name',
// 		message: 'Enter the name of your slice (2 words, PascalCased)',
// 		initial: 'eg. LargeHeader',
// 		validate: value => {
// 			if (fs.existsSync(`${slicesFolder}/${value}`)) {
// 				return 'Slice exists already, pick another name'
// 			}
// 			const kebabCased = hyphenate(value)
// 			if (kebabCased.indexOf('-') < 1) {
// 				return `Value has to be 2-worded when transformed into kebab-case.\neg. 'LargeHeader' will become 'large-header'`
// 			}
// 			return true
// 		}
// 	}
// 	// {
// 	//   type: "text",
// 	//   name: "twitterHandler",
// 	//   message: "What's your Twitter handler?",
// 	//   initial: "hyperVillain"
// 	// }
// ]

function formatLibPath(libPath) {
  if (libPath.indexOf('@/') === 0) {
    return libPath
  }
  if (libPath.indexOf('/') === 0) {
    return `@${libPath}`
  }
  return `@/${libPath}`
}

function inputPath() {
  return inquirer.prompt([{
    type: 'input',
    name: 'answer',
    default: 'slices',
    prefix: '🗂 ',
    message: `Where should we create the slice (starting from root):`,
    validate(input) {
      const isValid = isValidPath(path.join(process.cwd(), input))
      return isValid || 'Path is invalid'
    }
  }]);
}

function inputComponentName(pathToCreate) {
  return inquirer.prompt([{
    type: 'text',
    name: 'sliceName',
    message: 'Enter the name of your slice (2 words, PascalCased)',
    initial: 'eg. LargeHeader',
    prefix: '🍕',
    validate: value => {
      if (fs.existsSync(path.join(pathToCreate, value))) {
        return 'Slice exists already, pick another name'
      }
      const kebabCased = hyphenate(value)
      if (kebabCased.indexOf('-') < 1) {
        return `Value has to be 2-worded when transformed into kebab-case.\neg. 'LargeHeader' would become 'large-header'`
      }
      return true
    }
  }]);
}

function selectPathToLib(paths) {
  return inquirer.prompt([{
    type: 'list',
    name: 'answer',
    prefix: '🗂 ',
    message: `Where should we create this slice?`,
    choices: paths.map((p) => ({
      name: p,
      value: p
    }))
  }]);
}

export default async function() {
  const framework = await getFramework(ctx.SliceMachine)
  if (!framework || framework instanceof Error === true) {
    return consola.info('Exiting...');
  }
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

  const localibs = sm.libraries.reduce((acc, libPath) => {
    const { isLocal } = getLibraryInfoFromPath(libPath)
    if (isLocal) {
      return [...acc, libPath]
    }
    return acc
  }, [])

  let libPath = localibs && localibs[0]
  if (!localibs.length) {
    consola.info('No local folder configured with SliceMachine')
    const { answer } = await inputPath(localibs)
    libPath = formatLibPath(answer.trim())
    patchSmFile({ libraries: [libPath] }, true)
  } else if (localibs.length > 1) {
    const { answer } = await selectPathToLib(localibs)
    libPath = answer
  }

  const { pathToSlices } = getLibraryInfoFromPath(libPath)
  const { sliceName } = await inputComponentName(pathToSlices)

  await copy(
    path.join(__dirname, 'templates', framework),
    path.join(pathToSlices, sliceName),
    {
      componentName: sliceName
    }
  )

  console.log(`\n✅ ${framework} slice created at ${libPath}!`)

  console.log('Use it right away 👉 https://prismic.io');

}
