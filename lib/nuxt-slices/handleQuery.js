import request from 'request';
import fs from 'fs';
import tmp from 'tmp';


const SLICES_API = 'http://localhost:3000/api/rework';

// handleSliceQuery.js
export default async (params) => {
  const url = new URL(SLICES_API);
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
