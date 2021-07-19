// proxies to prevent mocking of node.js functions.
/**
 * import { readFile } from ../utls
 * */

import * as fs from 'fs'

export const readFile = fs.promises.readFile

export const writeFile = fs.promises.writeFile

export const unlink = fs.promises.unlink

export const rmdir = fs.promises.rmdir

export const mkdir = fs.promises.mkdir

export const readFileSync = fs.readFileSync

export const writeFileSync = fs.writeFileSync

export const existsSync = fs.existsSync

export const createWriteStream = fs.createWriteStream

export {copy} from 'fs-extra'
