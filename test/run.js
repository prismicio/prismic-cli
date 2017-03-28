const path = require('path');
const test = require('tape');
const spawn = require('tape-spawn');
const format = require('util').format;

function cmd(args) {
  return format('node "%s" %s', path.resolve(__dirname, '..', 'bin', 'prismic.js'), args);
}

const PROJECT = 'foobar';

test(`cli: prismic init foobar --folder /tmp/${PROJECT} --template NodeJS --noconfirm`, (t) => {
  const st = spawn(t, cmd(`init foobar --folder /tmp/${PROJECT} --template NodeJS --noconfirm`));
  const message =
`Let's get to it!
Initialize local project
Running npm install...
Your project is ready, to proceed:

Go to the project folder : cd /tmp/${PROJECT}
To have hot reload: npm install -g nodemon
Start your project: nodemon app.js
Point your browser to: http://localhost:3000\n`;

  st.stdout.match(message);
  st.end();
});
