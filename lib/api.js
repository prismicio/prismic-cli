'use strict';

var BASE = 'https://prismic.io';

var request = require('request');
var auth = require('./auth');

exports.login = function(email, password) {
  return new Promise(function(resolve, reject) {
    request.post(BASE + '/login', {
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
        auth.save(xhr.headers['set-cookie']);
        resolve(true);
        return;
      }
      console.log("Error: ", body);
      resolve(false);
    });
  });
};

exports.signup = function(firstName, lastName, email, password, accept) {
  return new Promise(function(resolve, reject) {
    request.post(BASE + '/signup', {
      followRedirect: false,
      form: {
        firstname: firstName,
        lastname: lastName,
        email: email,
        password: password,
        accept: (accept ? 'true' : 'false')
      }
    }, function(err, xhr, body) {
      if (err) {
        reject(err);
        return;
      }
      if (Math.floor(xhr.statusCode / 100) == 3) {
        auth.save(xhr.headers['set-cookie']);
        resolve(true);
        return;
      }
      console.log("Error: ", body);
      resolve(false);
    });
  });
};

exports.createRepository = function(domain, cookies) {
  return new Promise(function(resolve, reject) {
    request.post(BASE + '/authentication/newrepository', {
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
      console.log("Error: ", body);
      resolve(false);
    });
  });
};

