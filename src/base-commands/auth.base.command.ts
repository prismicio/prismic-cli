import Command, { flags } from '@oclif/command'
import inquirer = require('inquirer')

import Communication from '../utils/communication'
import Config from '../utils/config'
import { UI } from '../utils/helper'
import MagicLink from '../utils/magic-link'

export default abstract class AuthBaseCommand extends Command {
  static description = 'describe the command here'
  async promptSignup() {
    return inquirer.prompt([{
      type: 'input',
      name: 'email',
      message: 'Email: ',
      validate(email: string) {
        return email && email.length > 0
      },
    }, {
      type: 'password',
      name: 'password',
      message: 'Password: ',
      validate(password: string) {
        return password && password.length > 0
      }
    }])
  }

  async signup(email: string, password: string, baseURL: string = Config.defaults.baseURL()) {
    const url = `${baseURL}/authentication/signup?ml=true`
    const credentials = { email, password }
    try {
      const response = await Communication.post(url, credentials)
      const token = await MagicLink.parse(response)
      if (token) {
        await Config.set({ magicLink: token })
      }

    } catch (error) {
      const { errors } = JSON.parse(error)
      UI.displayErrors(errors)
      throw new Error()
    }
  }

  async signin(email: string, password: string, baseURL: string = Config.defaults.baseURL()) {
    const url = `${baseURL}/authentication/signin?ml=true`
    const credentials = { email, password }
    this.log(url)
    try {
      const response = await Communication.post(url, credentials)
      const token = await MagicLink.parse(response)
      if (token) {
        await Config.set({ magicLink: token })
      }

    } catch (error) {
      console.log(error)

      this.error(`Login error, check your credentials. If you forgot your password, visit ${baseURL} to reset it.`)
    }
  }

  async signout() {
    try {
      await Config.set({ cookies: '' })
      this.log('Successfully logged out!')
    } catch (error) {
      this.error(error)
    }
  }
}
