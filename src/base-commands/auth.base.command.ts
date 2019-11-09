import Command from '@oclif/command'
import inquirer = require('inquirer')

import Communication from '../utils/communication'
import Config from '../utils/config'
import MagicLink from '../utils/magic-link'

type Credential = { email: string, password: string }

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
    }]) as unknown as Credential
  }

  async signup(credential: Credential, magicLink = false, baseURL: string = Config.defaults.baseURL()) {
    const url = `${baseURL}/authentication/signup${magicLink ? '?ml=true' : ''}`
    const response = await Communication.post(url, credential)
    if (magicLink) {
      const token = await MagicLink.parse(response)
      if (token) {
        await Config.set({ magicLink: token })
      }
    }
  }

  async signin(credential: Credential, magicLink = false, baseURL: string = Config.defaults.baseURL()) {
    const url = `${baseURL}/authentication/signin${magicLink ? '?ml=true' : ''}`
    this.log(url)
    try {
      const response = await Communication.post(url, credential)
      if (magicLink) {
        const token = await MagicLink.parse(response)
        if (token) {
          await Config.set({ magicLink: token })
        }
      }

    } catch (error) {
      this.log(`Login error, check your credentials. If you forgot your password, visit ${baseURL} to reset it.`)
    }
  }

  async signout() {
    try {
      await Config.set({ cookie: '' })
      this.log('Successfully logged out!')
    } catch (error) {
      this.error(error)
    }
  }
}
