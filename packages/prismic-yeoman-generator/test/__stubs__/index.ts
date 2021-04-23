import * as AdmZip from 'adm-zip'
import * as path from 'path'

const Theme = new AdmZip()
const themePath = path.resolve(__dirname, 'fake-theme-master')

Theme.addLocalFolder(themePath, 'fake-theme-master')

export {
  Theme,
}

