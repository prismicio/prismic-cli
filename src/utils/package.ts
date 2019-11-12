import { existsSync } from 'fs'
import { platform } from 'os'
import { basename, join } from 'path'
import { cd, echo, exec } from 'shelljs'

const Package = {
  install(directory: string, manager: 'npm' | 'yarn' = 'npm') {
    const devnull = /^win/i.test(platform()) ? 'NUL' : '/dev/null 2>&1'
    cd(directory)
    if (existsSync(join(directory, 'package.json'))) {
      echo('Installing project dependencies...')
      exec(`${manager} install > ${devnull}`)
      echo('Your project is ready, to proceed:')
      echo()
      echo(`Run 'cd ${basename(directory)}'`)
      echo()
    }
  }
}

export default Package
