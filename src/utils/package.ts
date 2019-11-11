import { platform } from 'os'
import { basename, join } from 'path'
import { cd, echo, exec } from 'shelljs'
import { existsSync } from 'fs'

const Package = {
  install(directory: string) {
    const devnull = /^win/i.test(platform()) ? 'NUL' : '/dev/null 2>&1'
    cd(directory)
    if (existsSync(join(directory, 'package.json'))) {
      echo('Installing project dependencies...')
      exec(`npm install > ${devnull}`)
      echo('Your project is ready, to proceed:')
      echo()
      echo(`Run 'cd ${basename(directory)}'`)
      echo()
    }
  }
}

export default Package
