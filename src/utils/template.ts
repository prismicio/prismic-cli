import Prismic from './prismic'

export interface ITemplate {
  name: string
  url: string
  configuration: string
  directory: string
  instructions: string
  isQuickstart: boolean
}

const Template = {
  /**
   * Returns a list of available templates
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
   * Returns a list of available templates names
   */
  async available() {
    return (await this.fetch()).filter(t => !t.isQuickstart).map(t => t.name)
  }
}

/**
 * Converts an object from a prismic repository into a template
 * @param doc The response returned from a prismic repository
 */
function convertDocToTemplates(doc: any = {}): ITemplate[] {
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
