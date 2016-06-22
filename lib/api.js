'use strict';

var fetch = require('node-fetch');
var FormData = require('form-data');
var path = require('path');
var fs = require('fs');

function saveCredentials(cookies) {
  var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  var configFile = path.join(home, '.prismic');
  return new Promise(function(resolve, reject) {
    fs.writeFile(configFile, function(err) {
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
  return fetch('https://prismic.io/login', {
    method: 'POST',
    body: form
  }).then(function (res) {
    console.log("Status: ", res.status);
    if (res.status == 200) {
      console.log("Wiz cookies: ", res.headers.get('set-cookie'));
      return true;
    }
    return false;
  }).catch(function (err) {
    console.log("Error: ", err);
  });
};

exports.signup = function(firstName, lastName, email, password) {
  return fetch('https://prismic.io/signup', {
    method: 'POST',
    body: querystring.stringify({
      "email": email,
      "firstname": firstName,
      "lastname": lastName,
      "password": password,
      "accept": 1
    })
  }).then(function (res) {
    console.log("Got res: " + res);
    console.log("Wiz cookies: " + res.get('set-cookie'));
  });
};


