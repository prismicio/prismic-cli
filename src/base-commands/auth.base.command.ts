import Command, { flags } from '@oclif/command'
import inquirer = require('inquirer')

import Auth from '../utils/auth'
import Config from '../utils/config'

export default abstract class AuthBaseCommand extends Command {
  static description = 'describe the command here'
  static flags = {
    status: flags.boolean({ char: 's', description: 'Check the authentication status' })
  }

  static async promptAuthenticationMethod() {
    return inquirer.prompt({
      name: 'choice',
      message: 'You must be signed in to continue',
      type: 'list',
      choices: ['Sign In', 'Sign Out', 'Cancel']
    })
  }

  static async authenticate(action: (response: { choice: string | undefined }) => Promise<boolean>): Promise<void> {
    if (!(await Auth.isAuthenticated())) {
      while (!(await Auth.isAuthenticated())) {
        if (await action(await AuthBaseCommand.promptAuthenticationMethod())) {
          process.exit(0)
        }
      }
    }
  }

  static async promptCredential() {
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
    await Auth.signup(credential, magicLink, baseURL)
  }

  async signin(credential: Credential, magicLink = false, baseURL: string = Config.defaults.baseURL()) {
    await Auth.signin(credential, magicLink, baseURL)
  }

  async signout() {
    try {
      await Auth.signout()
      this.log('Successfully logged out!')
    } catch (error) {
      this.error(error)
    }
  }

  async status() {
    if (await Auth.isAuthenticated()) {
      this.log('Signed in')
    } else this.log('Signed out')
  }
}
