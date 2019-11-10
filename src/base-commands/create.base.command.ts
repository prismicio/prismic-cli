// src/base.ts
import Command, { flags } from '@oclif/command'
import { existsSync } from 'fs'
import inquirer = require('inquirer')
import { join } from 'path'

import Auth from '../utils/auth'
import Prismic from '../utils/prismic'
import Template, { ITemplate } from '../utils/template'

import AuthBaseCommand from './auth.base.command'

export default abstract class CreateBaseCommand extends Command {
  static flags = {
    directory: flags.string({ char: 'd' }),
    template: flags.string({ char: 't' }),
    token: flags.string({ char: 'a' }),
    'skip-prompt': flags.boolean({ char: 'P', default: false })
  }

  async promptRepositoryName(name: string, fresh = false): Promise<string> {
    // Base case: The name is provided via flags and is available
    if (name && await Prismic.isRepositoryAvailable(name)) {
      return name
    }

    // We can deduce that the name is provided but unavailable
    if (name) {
      this.log(`Seems like "${name}" is unavailable.`)
    }

    // Otherwise, keep prompting for the repository name
    const response = await inquirer.prompt({
      name: 'name',
      message: !fresh ? 'The name of your prismic repository' : 'The name of the prismic repository',
      validate(value) {
        return new RegExp('^[\\-\\w]+$').test(value) ? true : 'Your repository name can only contains alphanumeric characters, underscores or dashes'
      }
    })

    return this.promptRepositoryName(response.name || '', fresh)
  }

  async promptDirectoryName(primary: string, directory?: string): Promise<string> {
    // Base case: The directory name is provided
    if (directory) {
      const exists = existsSync(join(process.cwd(), directory))

      if (!exists) {
        return join(process.cwd(), directory)
      }

      this.log('Seems like the directory already exists')
    }

    // Otherwise, keep prompting for the directory name
    const response = await inquirer.prompt({
      name: 'directory',
      default: primary,
      message: 'The directory to create the new project'
    })

    return this.promptDirectoryName(primary, response.directory)
  }

  async promptTemplateList(templates: ITemplate[], template?: string): Promise<string> {
    const choices = await Template.available()
    // Base case: The template name is provided
    if (template) {
      // Determine if the template exists
      if (choices.map(name => name.toLowerCase()).includes(template.toLowerCase())) {
        return template
      }

      this.log(`Seems like "${template}" is not a valid choice`)
    }

    // Otherwise, keep prompting for the template
    const response = await inquirer.prompt({
      name: 'template',
      type: 'list',
      choices,
      message: 'Technology to use for your project'
    })

    return this.promptTemplateList(templates, response.template)
  }

  async authenticate() {
    await AuthBaseCommand.authenticate(async response => {
      switch ((response.choice || '').toLowerCase()) {
        case 'sign in':
          this.log('Sign in')
          await Auth.singin(await AuthBaseCommand.promptCredential())
          return false
        case 'sign up':
          this.log('Sign up')
          await Auth.singup(await AuthBaseCommand.promptCredential())
          return false
        default: return true
      }
    })
  }
}
