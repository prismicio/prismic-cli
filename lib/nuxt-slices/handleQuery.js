import request from 'request';
import fs from 'fs';
import tmp from 'tmp';


const SLICES_API = 'https://community-slices.herokuapp.com';
const SLICES_API_LOCAL = 'http://localhost:3000';

const ALL_SLICES = '/api/slices';

// handleSliceQuery.js
export default async (dev, params) => {
  const href = `${dev ? SLICES_API_LOCAL : SLICES_API}${ALL_SLICES}`;
  const url = new URL(href);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

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
