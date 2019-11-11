import Command from '@oclif/command'
import inquirer = require('inquirer')

import Config from '../utils/config'

export default class BaseURLCommand extends Command {
  static description = 'describe the command here'
  static hidden = true

  static examples = [
    '$ prismic-cli base'
  ]

  async run() {
    try {
      const response = await this.promptBaseURL()
      await Config.set({ cookie: '', base: response.base })
      this.log(`The base is now ${await Config.get('base')}`)
    } catch (error) {
      this.error(error)
    }
  }

  async promptBaseURL() {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'base',
        message: 'New base url: (staff only, ex: https://prismic.io )',
        default: Config.defaults.baseURL(),
      },
    ])
  }
}
