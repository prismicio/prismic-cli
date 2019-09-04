import fs from 'fs';
import request from 'request';
import AdmZip from 'adm-zip';
import tmp from 'tmp';
import shell from 'shelljs';
import Helpers from '../helpers';

const SLICES_API = 'https://community-slices.herokuapp.com/api/slices';
const VUE_SLICES_FOLDER = './sliceMachine';

/*
  If you don't want to hanlde slices here at some point,
  rename this function and return tmpZipFile.
 */

function extractModel(zip, fileName) {
  try {
    return JSON.parse(zip.readAsText(fileName));
  } catch (e) {
    return {};
  }
}

export default async function handleSlices() {
  const allSlicesUrl = `${SLICES_API}/all`;
  const tmpZipFile = tmp.tmpNameSync();
  return new Promise((resolve, reject) => {
    request(allSlicesUrl)
      .on('response', (response) => {
        response.pipe(fs.createWriteStream(tmpZipFile))
          .on('error', ({ message }) => reject(message))
          .on('finish', () => {
            const zip = new AdmZip(tmpZipFile);
            // IRS, you don't want to overwrite everytime/everything
            zip.extractEntryTo('example.vue', 'pages', true, true);
            zip.deleteFile('example.vue');
            zip.extractAllTo(VUE_SLICES_FOLDER, true);
            const choices = extractModel(zip, 'model.json');
            shell.rm(tmpZipFile);
            resolve(choices);
          });
      })
      .on('error', () => {
        Helpers.UI.display('Could not fetch slices. Exiting...');
        reject();
      });
  });
}
