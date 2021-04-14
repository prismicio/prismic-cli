import PrismicGenerator from '../prismic-generator'
import * as path from 'path'
import {AxiosResponse} from 'axios'

export default class PrismicVue extends PrismicGenerator {
  async initializing() {
    return this.downloadAndExtractZipFrom('https://github.com/prismicio/vuejs-starter/archive/master.zip', 'vuejs-starter-master')
  }

  async configuring() {
    this.log('Creating repository')
    const customTypes = this.readCustomTypesFrom('custom_types')
    return this.prismic.createRepository({
      domain: this.domain,
      customTypes,
    }).then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data}.${url.host}`
      this.log(`A new repository has been created at: ${url.toString()}`)
      return res
    })
    .then((res: AxiosResponse<any>) => {
      const location = path.join(this.path, 'public/index.html')
      const oldConfig = this.fs.read(location)
      const newConfig = oldConfig.replace(/your-repo-name/g, res.data || this.domain)
      this.fs.write(location, newConfig)
    })
  }

  async install() {
    return this.npmInstall()
  }
}
