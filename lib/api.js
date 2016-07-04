'use strict';

var request = require('request');
var config = require('./config');

exports.login = function(base, email, password) {
  return new Promise(function(resolve, reject) {
    request.post(base + '/login', {
      form: {
        email: email,
        password: password,
        next: 'reload'
      }
    }, function(err, xhr, body) {
      if (err) {
        reject(err);
        return;
      }
      if (xhr.statusCode == 200) {
        config.set({cookies: xhr.headers['set-cookie'][0]}).then(function(){
          resolve(true);
        });
        return;
      }
      resolve(false);
    });
  });
};

exports.signup = function(base, email, password) {
  return new Promise(function(resolve, reject) {
    request.post(base + '/signup', {
      followRedirect: false,
      form: {
        firstname: email.split('@')[0],
        lastname: email.split('@')[0],
        email: email,
        password: password,
        accept: 'true'
      }
    }, function(err, xhr, body) {
      if (err) {
        reject(err);
        return;
      }
      if (Math.floor(xhr.statusCode / 100) == 3) {
        config.set({
          cookies: xhr.headers['set-cookie'][0]
        }).then(function() {
          resolve(true);
        });
        return;
      }
      console.log('Error: ', body);
      resolve(false);
    });
  });
};

exports.exists = function(base, domain) {
  return new Promise(function(resolve, reject) {
    request(base + '/app/dashboard/repositories/' + domain + '/exists', function(err, xhr, body) {
      if (err) {
        reject(err);
      } else {
        // For some reason the response of 'exists' is reverted, is returns wether the domain is free of not
        resolve(body === 'false');
      }
    });
  });
};

exports.createRepository = function(cookies, base, domain) {
  return new Promise(function(resolve, reject) {
    request.post(base + '/authentication/newrepository', {
      form: {
        domain: domain,
        plan: 'personal',
        isAnnual: 'false'
      },
      headers: {
        'cookie': cookies
      }
    }, function (err, xhr, body) {
      if (err) {
        reject(err);
        return;
      }
      if (Math.floor(xhr.statusCode / 100) == 2) {
        resolve(domain);
        return;
      }
      resolve(false);
    });
  });
};

