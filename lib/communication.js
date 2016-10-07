import request from 'request';
import config from './config';

export const Domain = {
  Default: 'https://prismic.io',
  WithDomain(domain) {
    const matches = DEFAULT_BASE.match(new RegExp('((https?://)([^/]*))'));
    return matches[2] + domain + '.' + matches[3];
  }
};

export default {
  post(url, data, cookies) {
    const options = {
      followRedirect: false,
      form: data
    };
    if(cookies) {
      options.headers = {cookies};
    }
    return new Promise((resolve, reject) => {
      request.post(url, options, function(err, xhr, body) {
        if (err) {
          reject(err);
          return;
        }
        if (xhr.statusCode == 200) {
          config.set({cookies: xhr.headers['set-cookie'][0]}).then(function(){
            resolve();
          });
          return;
        }
        reject();
      });
    });
  },

  get(baseURL, cookies) {
    return new Promise((resolve, reject) => {
      request.get(url, function(err, xhr, body) {
        if(err) {
          reject(err);
          return;
        }
        if (xhr.statusCode == 200) {
          config.set({cookies: xhr.headers['set-cookie'][0]}).then(function(){
            resolve(body);
          });
          return;
        }
        reject();
      });
    });
  }
}
