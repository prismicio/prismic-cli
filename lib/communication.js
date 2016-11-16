'use strict';

import request from 'request';
import config from './config';

export default {
  post(url, data, cookies) {
    const options = {
      followRedirect: false,
      form: data
    };
    if(cookies) {
      options.headers = {cookie: cookies};
    }
    return new Promise((resolve, reject) => {
      request.post(url, options, function(err, xhr, body) {
        if (err) {
          reject();
          return;
        }
        if (xhr.statusCode == 200 || Math.floor(xhr.statusCode / 100) == 3) {
          const setCookies = xhr.headers['set-cookie'];
          if(setCookies) {
            config.set({cookies: setCookies[0]}).then(function(){
              resolve();
            });
          } else resolve();
          return;
        } else {
          reject(body);
        }
      });
    });
  },

  get(url, cookies) {
    return new Promise((resolve, reject) => {
      const options = {};
      if(cookies) {
        options.headers = {cookie: cookies};
      }
      request.get(url, options, function(err, xhr, body) {
        if(err) {
          reject(err);
          return;
        }
        if (xhr.statusCode == 200) {
          const setCookies = xhr.headers['set-cookie'];
          if(setCookies) {
            config.set({cookies: setCookies[0]}).then(function(){
              resolve(body);
            });
          } else resolve(body);
          return;
        }
        reject();
      });
    });
  }
};
