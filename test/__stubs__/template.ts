import * as AdmZip from 'adm-zip'
import * as path from 'path'

const nodejsPath = path.resolve(__dirname, 'nodejs-sdk-master')
const NodeJS = new AdmZip()

NodeJS.addLocalFolder(nodejsPath, 'nodejs-sdk-master')

export default NodeJS
