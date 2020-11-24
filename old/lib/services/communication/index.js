import request from 'request';
import { ctx, setCookies } from '../../context';
import {
  ForbiddenError, UnauthorizedError, UnknownError, InternalServerError,
} from './errors';
import globals from '../../globals';
import Helpers from '../../helpers';

function post(url, queryParams = {}, opts) {
  const csrf = (() => {
    const keyValue = ctx.cookies && ctx.cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith('X_XSRF'));
    const splitted = keyValue && keyValue.split('=');
    return splitted && splitted.length === 2 ? keyValue.split('=')[1] : null;
  })();

  const qs = Helpers.Url.buildQueryString({ ...queryParams, _: csrf });

  const options = { followRedirect: false, ...opts };
  if (ctx.cookies) {
    options.headers = { cookie: ctx.cookies, userAgent: globals.USER_AGENT };
  }

  return new Promise((resolve, reject) => {
    request.post(url + qs, options, (err, xhr, body) => {
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
}

export default {
  postJson(url, data, qs) {
    return post(url, qs, {
      body: data,
      json: true,
    });
  },

  postForm(url, data, qs) {
    return post(url, qs, {
      form: data,
    });
  },

  get(baseUrl, data) {
    return new Promise((resolve, reject) => {
      const options = {};
      if (ctx.cookies) {
        options.headers = { cookie: ctx.cookies, userAgent: globals.USER_AGENT };
      }
      const qs = Helpers.Url.buildQueryString(data);
      request.get(baseUrl + qs, options, (err, xhr, body) => {
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

        reject(new Error(`[fetch] An unexpected (${xhr.statusCode}) Error occured.\nUrl: ${baseUrl + qs}`));
      });
    });
  },

  async getAsJson(baseUrl, data) {
    return JSON.parse(await this.get(baseUrl, data));
  },
};
