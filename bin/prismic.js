'use strict';

//Modules dependencies

var _login = require('./login');

var _login2 = _interopRequireDefault(_login);

var _signup = require('./signup');

var _signup2 = _interopRequireDefault(_signup);

var _repository = require('./repository');

var _repository2 = _interopRequireDefault(_repository);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

var _communication = require('./communication');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var _commandLineCommands = require('command-line-commands');

var _commandLineCommands2 = _interopRequireDefault(_commandLineCommands);

var _commandLineUsage = require('command-line-usage');

var _commandLineUsage2 = _interopRequireDefault(_commandLineUsage);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO:
// - specific runtime instructions from the template, directly on prompt?

var templates = require('./templates');

// === Help

function help(config) {
  console.log((0, _commandLineUsage2.default)([{
    header: 'Synopsis',
    content: '$ prismic <command> <domain> <options>'
  }, {
    header: 'Examples',
    content: [{ name: '$ prismic init foobar', summary: 'Create a project for the foobar repository' }, { name: '$ prismic new foobar', summary: 'Create the foobar repository then initialize the project (fails if already exists).' }, { name: '$ prismic init foobar --template NodeJS --noconfirm', summary: 'Create a NodeJS project, non-interactive' }]
  }, {
    header: 'Command List',
    content: [{ name: 'init', summary: 'Create a project: initialize the code from a template for an existing repository.' }, { name: 'new', summary: 'Create the repository initialize the code from a template.' }, { name: 'login', summary: 'Login to an existing prismic.io account.' }, { name: 'logout', summary: 'Logout from an existing prismic.io account.' }, { name: 'signup', summary: 'Create a new prismic.io account.' }, { name: 'list', summary: 'List the available code templates.' }, { name: 'version', summary: 'Print the version.' }]
  }, {
    header: 'Options',
    optionList: [{ name: 'email', description: 'The email of the account to use.' }, { name: 'password', description: 'The password of the account to use.' }, { name: 'folder', description: 'The folder to create the new project.' }, { name: 'template', description: 'Project template to use (see the list command for available templates).' }, { name: 'noconfirm', description: 'Set to "true" to always use the default answer without asking. Fails if information is missing.' }]
  }]));
}

// === Commands

function version() {
  _helpers2.default.UI.display(_package2.default.version);
}

function init(config, domain, args) {
  var base = config.base || _communication.Domain.Default;
  var noconfirm = args['--noconfirm'] === 'true';
  _helpers2.default.UI.display('Initialize project for ' + base);
  return _repository2.default.create(base, domain, args).then(function (template) {
    _helpers2.default.UI.display('Successfully created your template : ' + template.name + ' !');
  });
}

// For testing only
function heroku(config, args) {
  console.log('Initialize heroku project');
  // ui.heroku(args['--template']).then(function(answers) {
  //   console.log('Running npm install...');
  //   var devnull = isWin ? 'NUL' : '/dev/null';
  //   shell.exec('npm install > ' + devnull);
  //   console.log('Your project in ready! Next steps:');
  //   console.log(' => Open your writing room: \'heroku addons:docs prismic\'');
  //   console.log(' => Create the custom types as described in the docs: \'heroku addons:docs prismic\'');
  //   console.log(' => Run the project: \'heroku local\'');
  // }).catch(function(err) {
  //   console.log('Error: ' , err);
  // });
}

function signup(config, args) {
  var base = config.base || _communication.Domain.Default;
  (0, _signup2.default)(base, args['--email'], args['--password']).then(function () {
    return _helpers2.default.UI.display('Successfully created your account! You can now create repositories.');
  });
}

function login(config, args) {
  var base = config.base || _communication.Domain.Default;
  (0, _login2.default)(base, args['--email'], args['--password']).then(function () {
    return _helpers2.default.UI.display('Successfully logged in! You can now create repositories.');
  });
}

function logout(config, args) {
  _config2.default.set({ cookies: '' }) // clear the cookies
  .then(function () {
    return _helpers2.default.UI.display('Successfully logged out !');
  }).catch(function (err) {
    return console.log(err);
  });
}

function list() {
  _helpers2.default.UI.display('Available templates:');
  _helpers2.default.UI.display(templates.TEMPLATES.map(function (template) {
    return '* ' + template.name;
  }));
}

// Should only be used by staff, which is why it's not documented
// prismic base http://wroom.dev
function base(base) {
  (0, _base2.default)(base).then(function (newBase) {
    _helpers2.default.UI.display('Successfully changed base ' + newBase + ' !');
  });
}

// === Main function

function parseArguments(args) {
  return (0, _lodash2.default)(args).chunk(2).reduce(function (result, value) {
    result[value[0]] = value[1];
    return result;
  }, {});
}

function main() {
  var validCommands = [null, 'init', 'heroku', 'login', 'logout', 'signup', 'base', 'version', 'list'];
  var arr = (0, _commandLineCommands2.default)(validCommands);
  var command = arr.command;
  var firstArg = null;
  if (arr.argv.length > 0 && arr.argv[0].indexOf('--') != 0) {
    firstArg = arr.argv.shift();
  }
  var args = parseArguments(arr.argv);
  _config2.default.getAll().then(function (config) {
    switch (command) {
      case 'login':
        login(config, args);
        break;
      case 'logout':
        logout(config, args);
        break;
      case 'signup':
        signup(config, args);
        break;
      case 'init':
        init(config, firstArg, args);
        break;
      case 'heroku':
        heroku(config, args);
        break;
      case 'list':
        list();
        break;
      case 'base':
        base(firstArg);
        break;
      case 'version':
        version(config);
        break;
      default:
        help(config);
    }
  });
}

try {
  main();
} catch (ex) {
  console.log(ex.message);
  help();
}