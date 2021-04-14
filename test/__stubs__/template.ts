import * as AdmZip from 'adm-zip'
import * as path from 'path'

const nodejsPath = path.resolve(__dirname, 'nodejs-sdk-master')
const NodeJS = new AdmZip()

NodeJS.addLocalFolder(nodejsPath, 'nodejs-sdk-master')

const Theme = new AdmZip()
const themePath = path.resolve(__dirname, 'fake-theme-master')

Theme.addLocalFolder(themePath, 'fake-theme-master')

export {
  Theme,
  NodeJS,
}

