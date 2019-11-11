import { extract, fetch } from 'gitly'

import { CreateFactory } from '../interfaces/create'
import Config from '../utils/config'
import { CustomType, Document } from '../utils/helper'
import Package from '../utils/package'
import Repository from '../utils/repository'
import Template from '../utils/template'

export default (async (name, directory, method, {
  template, theme, users, token, quickstart, cache, ...flags
}) => {
  template = quickstart ? 'nodejs' : template

  const url = (await Template.find(template)).url || theme

  if (!url) throw new Error('Could not create a new project')

  // Download the template and extract it (if no cache is available)
  const temp = await fetch(url, { cache })
  const path = await extract(temp, directory)

  if ((template || theme) && !flags['skip-config']) {
    Template.replace(directory, flags.config, [
      {
        pattern: /your-repo-name/,
        value: name
      }
    ])

    if (template) await Template.install(directory, template)
    else Package.install(directory)
  }

  if (method === 'new') {
    // Grab the necessary info to create a repository
    const types = await CustomType.read(path)
    const documents = await Document.read(path)
    const baseURL = await Config.get('base') || Config.defaults.baseURL()
    const cookie = await Config.get('cookie')

    await Repository.create(name, token ? 'token' : 'cookie', {
      baseURL,
      users,
      token,
      cookie,
      documents,
      types
    })
  }
}) as CreateFactory
