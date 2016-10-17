module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "parser": "babel-eslint",
  "extends": "eslint:recommended",
  "rules": {
    "no-console": 0,
    "indent": [
      "warn",
      2
    ],
    "no-unused-vars": ["error", { "vars": "all", "args": "none" }],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "warn",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ]
  },
  "parserOptions": {
    "sourceType": "module"
  }
};
