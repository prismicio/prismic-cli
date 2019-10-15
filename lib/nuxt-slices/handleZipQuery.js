import request from 'request';
import fs from 'fs';
import tmp from 'tmp';


export const SLICES_API = 'https://community-slices.herokuapp.com';
export const SLICES_API_LOCAL = 'http://localhost:3000';

const BOOTSTRAP = '/api/bootstrap';
const ALL_SLICES = '/api/slices';
export const ALL_MODELS = '/api/models';

export default async (bootstrap, params, dev) => {
  const href = `${dev ? SLICES_API_LOCAL : SLICES_API}${bootstrap ? BOOTSTRAP : ALL_SLICES}`;
  const url = new URL(href);

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  console.log(url);
  const tmpZipFile = tmp.tmpNameSync();
  return new Promise((resolve, reject) => {
    request(url.href)
      .on('response', (response) => {
        response.pipe(fs.createWriteStream(tmpZipFile))
          .on('error', ({ message }) => reject(message))
          .on('finish', () => resolve(tmpZipFile));
      })
      .on('error', reject);
  });
};
