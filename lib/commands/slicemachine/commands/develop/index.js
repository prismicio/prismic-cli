import shell from 'shelljs';
import Deps from '../../../../common/dependencies'
import { getOrFail as getSmFile } from '../../methods/sm';
import login from '../../../login'
import { fetchCtsApi } from './fetch';


const develop = async function () {
  const sm = getSmFile();
  const { apiEndpoint } = sm
  if (!apiEndpoint) {
    return console.error('[slice-machine] No "apiEndpoint" value found in sm.json.\nIn order to run this command, you need to set a Prismic repository endpoint')
  }
  let domain = (() => {
    try {
      return apiEndpoint.substring(apiEndpoint.indexOf('://') + 3).split('.')[0]
    } catch(e) {
      console.error('[slice-machine] Could not parse domain from given "apiEndpoint" (must start with http.s protocol)')
      throw e

    }
  })()

  const res = await fetchCtsApi(domain)
  if (res instanceof Error) {
    await login()
    return develop()
  }

  const Manager = Deps.detectPackageManager()
  shell.exec(`${Manager.runCmd} slicemachine`);
}

export default develop
