'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Types = {
  String: 'string',
  Object: 'object'
};

exports.default = {
  UI: {
    display: function display(messages) {
      if (Types.String === (typeof messages === 'undefined' ? 'undefined' : _typeof(messages))) console.log(messages);else console.log(messages.join('\n'));
    },
    displayErrors: function displayErrors(errors) {
      if (Types.String === (typeof errors === 'undefined' ? 'undefined' : _typeof(errors))) console.log(errors);else {
        var errorsMsg = Object.keys(errors).reduce(function (acc, field) {
          var fieldErrors = errors[field];
          return acc.concat(fieldErrors);
        }, []);
        this.display(errorsMsg);
      }
    }
  }
};