import request from 'request';
import config from './config';
import { ForbiddenError, UnauthorizedError, UnknownError, InternalServerError } from './errors';

export default {
  post(url, data, cookies) {
    const options = {
      followRedirect: false,
      form: data,
    };
    if (cookies) {
      options.headers = { cookie: cookies };
    }
    return new Promise((resolve, reject) => {
      request.post(url, options, (err, xhr, body) => {
        if (err) {
          return reject(err, xhr);
        }
        if (xhr.statusCode === 200 || Math.floor(xhr.statusCode / 100) === 3) {
          const setCookies = xhr.headers['set-cookie'];
          if (setCookies) {
            const formattedCookie = setCookies.reduce((acc, c) => `${acc};${c}`, '');
            config.set({ cookies: formattedCookie }).then(() => {
              resolve();
            });
          } else resolve(body);
        } else {
          if (!xhr) reject(UnknownError(err));
          if (xhr.statusCode === 401) reject(new UnauthorizedError(err));
          else if (xhr.statusCode === 403) reject(new ForbiddenError(err));
          reject(new InternalServerError(xhr.statusCode, err));
        }
        return null;
      });
    });
  },

  get(url, cookies) {
    return new Promise((resolve, reject) => {
      const options = {};
      if (cookies) {
        options.headers = { cookie: cookies };
      }
      request.get(url, options, (err, xhr, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (xhr.statusCode === 200) {
          const setCookies = xhr.headers['set-cookie'];
          if (setCookies) {
            config.set({ cookies: setCookies[0] }).then(() => {
              resolve(body);
            });
          } else resolve(body);
          return;
        }
        reject(new Error('Unexpected Error'));
      });
    });
  },
};
