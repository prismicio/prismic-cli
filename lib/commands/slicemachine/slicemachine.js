import request from 'request';
import tmp from 'tmp';
import fs from 'fs';
import Communication from '../../services/communication';

function handleUrl(endpoint, params) {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

const SliceMachine = {
  /**
   * should get all slices (keys + definitions) and match their
   */
  async fetchAllSlicesModels(endpoint, params) {
    const url = handleUrl(endpoint, params);
    return JSON.parse(await Communication.get(url.href));
  },

  /* returns the path of the zip file or an Error */
  downloadSlices: async (endpoint, params) => {
    const url = handleUrl(endpoint, params);
    const tmpZipFile = tmp.tmpNameSync();
    return new Promise((resolve, reject) => {
      request(url.href)
        .on('response', (response) => {
          response.pipe(fs.createWriteStream(tmpZipFile))
            .on('error', ({ message }) => {
              reject(message);
            })
            .on('finish', () => resolve(tmpZipFile));
        })
        .on('error', (e) => {
          console.error('Unable to access our servers.. If the problem persists, contact us?');
          reject(e);
        });
    });
  },
};

export default SliceMachine;
