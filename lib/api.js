'use strict';

var BASE = 'https://prismic.io';

var request = require('request');
var fetch = require('node-fetch');
var FormData = require('form-data');
var path = require('path');
var fs = require('fs');

function saveCredentials(cookies) {
  var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  var configFile = path.join(home, '.prismic');
  return new Promise(function(resolve, reject) {
    fs.writeFile(configFile, cookies, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

exports.login = function(email, password) {
  var form = new FormData();
  form.append('email', email);
  form.append('password', password);
  form.append('next', 'reload');
  return fetch(BASE + '/login', {
    method: 'POST',
    body: form
  }).then(function (res) {
    if (res.status == 200) {
      saveCredentials(res.headers.get('set-cookie'));
      return true;
    }
    return false;
  }).catch(function (err) {
    console.log("Error: ", err);
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
      console.log("err: ", err);
      if (err) {
        reject(err);
        return;
      }
      if (Math.floor(xhr.statusCode / 100) == 3) {
        saveCredentials(xhr.headers['set-cookie']);
        resolve(true);
        return;
      }
      console.log("Error: ", body);
      resolve(false);
    });
  });
};


