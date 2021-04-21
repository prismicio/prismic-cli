import fetch from 'node-fetch';
import request from 'request';
import { ctx, setCookies } from '../../context';
import {
  ForbiddenError,
  UnauthorizedError,
  UnknownError,
  InternalServerError,
} from './errors';
import globals from '../../globals';
import Helpers from '../../helpers';

function post(url, queryParams = {}, opts) {
  const csrf = (() => {
    const keyValue = ctx.cookies
      && ctx.cookies
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('X_XSRF'));
    const splitted = keyValue && keyValue.split('=');
    return splitted && splitted.length === 2 ? keyValue.split('=')[1] : null;
  })();

  const qs = Helpers.Url.buildQueryString({ ...queryParams, _: csrf });

  const options = { followRedirect: false, ...opts };
  if (ctx.cookies) {
    options.headers = {
      ...opts.headers,
      cookie: ctx.cookies,
      userAgent: globals.USER_AGENT,
    };
  }

  return new Promise((resolve, reject) => {
    request.post(url + qs, options, (err, xhr, body) => {
      if (err) {
        return reject(err, xhr);
      }
      const success = xhr.statusCode === 200;

      if (success || Math.floor(xhr.statusCode / 100) === 3) {
        const cookies = xhr.headers['set-cookie'];
        if (cookies) {
          const formattedCookie = cookies.join(';');
          setCookies(formattedCookie);
        }
        resolve(success ? body : xhr);
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
  postJson(url, data, qs, opts) {
    return post(url, qs, {
      ...opts,
      body: data,
      json: true,
    });
  },

  postForm(url, data, qs, opts) {
    return post(url, qs, {
      ...opts,
      form: data,
    });
  },

  get(baseUrl, data, opts, method = 'get') {
    return new Promise((resolve, reject) => {
      const options = opts || {};
      if (ctx.cookies) {
        options.headers = {
          ...options.headers,
          cookie: ctx.cookies,
          userAgent: globals.USER_AGENT,
        };
      }
      const qs = data ? Helpers.Url.buildQueryString(data) : '';
      request[method](baseUrl + qs, options, (err, xhr, body) => {
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

        reject(
          new Error(
            `[fetch] An unexpected (${xhr.statusCode}) Error occured.\nUrl: ${
              baseUrl + qs
            }`,
          ),
        );
      });
    });
  },

  delete(baseUrl, data, opts) {
    return this.get(baseUrl, data, opts, 'delete');
  },

  upsert(baseUrl, data, opts) {
    return fetch(baseUrl, { ...opts, method: 'POST', body: data });
  },

  async getAsJson(baseUrl, data, opts) {
    return JSON.parse(await this.get(baseUrl, undefined, opts));
  },
};
