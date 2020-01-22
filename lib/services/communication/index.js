import request from 'request';
import { ctx, setCookies } from '../../context';
import { ForbiddenError, UnauthorizedError, UnknownError, InternalServerError } from './errors';

export default {
  post(url, data) {
    const options = {
      followRedirect: false,
      form: data,
    };
    if (ctx.cookies) {
      options.headers = { cookie: ctx.cookies };
    }
    return new Promise((resolve, reject) => {
      request.post(url, options, (err, xhr, body) => {
        if (err) {
          return reject(err, xhr);
        }
        if (xhr.statusCode === 200 || Math.floor(xhr.statusCode / 100) === 3) {
          const cookies = xhr.headers['set-cookie'];
          if (cookies) {
            const formattedCookie = cookies.join(';');
            setCookies(formattedCookie);
            resolve();
          }
          resolve(body);
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

  get(url) {
    return new Promise((resolve, reject) => {
      const options = {};
      if (ctx.cookies) {
        options.headers = { cookie: ctx.cookies };
      }
      request.get(url, options, (err, xhr, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (xhr.statusCode === 200) {
          const cookies = xhr.headers['set-cookie'];
          if (cookies) {
            const formattedCookie = cookies.join(';');
            setCookies(formattedCookie);
            resolve(body);
          }
          resolve(body);
        }
        reject(new Error('Unexpected Error'));
      });
    });
  },
};
