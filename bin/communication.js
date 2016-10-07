'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Domain = undefined;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Domain = exports.Domain = {
  Default: 'https://prismic.io',
  WithDomain: function WithDomain(domain) {
    var matches = DEFAULT_BASE.match(new RegExp('((https?://)([^/]*))'));
    return matches[2] + domain + '.' + matches[3];
  }
};

exports.default = {
  post: function post(url, data, cookies) {
    var options = {
      followRedirect: false,
      form: data
    };
    if (cookies) {
      options.headers = { cookies: cookies };
    }
    return new Promise(function (resolve, reject) {
      _request2.default.post(url, options, function (err, xhr, body) {
        if (err) {
          reject();
          console.log("An error occured during your account creation. Please try again.");
          return;
        }
        if (xhr.statusCode == 200) {
          if (!cookies) {
            _config2.default.set({ cookies: xhr.headers['set-cookie'][0] }).then(function () {
              resolve();
            });
          } else resolve();
          return;
        }
        reject(body);
      });
    });
  },
  get: function get(baseURL, cookies) {
    return new Promise(function (resolve, reject) {
      _request2.default.get(url, function (err, xhr, body) {
        if (err) {
          reject(err);
          return;
        }
        if (xhr.statusCode == 200) {
          _config2.default.set({ cookies: xhr.headers['set-cookie'][0] }).then(function () {
            resolve(body);
          });
          return;
        }
        reject();
      });
    });
  }
};