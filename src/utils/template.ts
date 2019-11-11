import { existsSync } from 'fs'
import { platform } from 'os'
import { basename, join } from 'path'
import { cd, echo, exec, sed } from 'shelljs'

import { Template as PrismicTemplate } from '../interfaces/template'

import Prismic from './prismic'

const Template = {
  /**
   * Return a list of available templates
   */
  async fetch() {
    try {
      const api: any = await Prismic.getApi()
      const doc: any = await api.getSingle('cli')
      return convertDocToTemplates(doc)
    } catch (error) {
      return []
    }
  },
  /**
   * Return a list of available templates names
   */
  async available() {
    return (await this.fetch()).filter(t => !t.isQuickstart).map(t => t.name)
  },
  /**
   * Find a template
   * @param template The name of the template
   */
  async find(template: string | undefined): Promise<PrismicTemplate> {
    if (!template) return ({} as any)
    return (await this.fetch()).map(t => {
      let { url, ...rest } = t
      return { url: url.replace('/archive/master.zip', ''), ...rest } as PrismicTemplate
    }).find(t => t.name.toLowerCase() === template.toLowerCase()) || ({} as any)
  },
  /**
   * Replace patterns found in the configuration file
   * @param directory The path to the project
   * @param configuration The configuration file
   * @param rules The pattern to replace in the file
   */
  replace(directory: string, configuration: string, rules: { pattern: RegExp, value: string }[]) {
    const path = join(directory, configuration)
    if (existsSync(path)) {
      rules.forEach(rule => sed('-i', rule.pattern, rule.value, path))
    }
  },
  /**
   * Installs the necessary dependencies
   * @param directory The path to the project
   * @param template The template to install
   */
  async install(directory: string, template: string) {
    const devnull = /^win/i.test(platform()) ? 'NUL' : '/dev/null 2>&1'
    const { instructions } = await this.find(template)
    const cwd = process.cwd()
    cd(directory)
    echo('Installing project dependencies...')
    exec(`npm install > ${devnull}`)
    echo('Your project is ready, to proceed:')
    echo()
    echo(`Run 'cd ${basename(directory)}'`)
    echo()
    if (instructions) {
      if (typeof instructions === 'string') {
        echo(instructions)
      } else {
        echo(instructions.join('\n'))
      }
    }
    cd(cwd)
  }
}

/**
 * Converts an object from a prismic repository into a template
 * @param doc The response returned from a prismic repository
 */
function convertDocToTemplates(doc: any = {}): PrismicTemplate[] {
  return doc.getSliceZone('cli.templates').slices.reduce((acc: any, slice: any) => {
    if (slice.sliceType === 'template') {
      const template = slice.value.toArray()[0]
      const name = template.getText('name')
      const url = template.getText('url')
      const configuration = template.getText('configuration')
      const directory = template.getText('innerFolder')
      const instructions = template.getText('instructions')
      const isQuickstart = template.getText('is-quickstart') === 'yes'
      return acc.concat([{
        name,
        url,
        configuration,
        directory,
        instructions,
        isQuickstart
      }])
    }
    return acc
  }, [])
}

export default Template
