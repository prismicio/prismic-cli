import PrismicGenerator from '../base'
import * as path from 'path'
import {AxiosResponse} from 'axios'

export default class PrismicAngular extends PrismicGenerator {
  async initializing() {
    return this.downloadAndExtractZipFrom('https://github.com/prismicio/angular2-starter/archive/master.zip', 'angular2-starter-master')
  }

  async configuring() {
    return this.prismic.createRepository({
      domain: this.domain,
    }).then(res => {
      const url = new URL(this.prismic.base)
      url.host = `${res.data}.${url.host}`
      this.log(`A new repository has been created at: ${url.toString()}`)
      return res
    })
    .then((res: AxiosResponse<any>) => {
      const location = path.join(this.path, 'src', 'prismic-configuration.ts')
      const oldConfig = this.readDestination(location)
      const newConfig = oldConfig.replace(/your-repo-name/g, res.data || this.domain)
      this.fs.write(location, newConfig)
    })
  }

  async install() {
    return this.npmInstall()
  }
}
