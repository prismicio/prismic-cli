import Communication, { Domain } from './communication'
import inquirer from 'inquirer'
import Helpers from './helpers'

function exec(base, email, password) {
  return new Promise((resolve) => {
    function run() {
      return prompt()
      .then((answers) => {
        query(base, answers.email, answers.password)
        .then(() => resolve())
        .catch((err) => {
          if(err) {
            const errors = JSON.parse(err).errors
            Helpers.UI.displayErrors(errors)
          }
          run()
        })
      })
    }
    return run()
  })
}

function prompt() {
  return inquirer.prompt([{
    type: 'input',
    name: 'email',
    message: 'Email: ',
    validate(email) {
      return email && email.length > 0;
    }
  }, {
    'type': 'password',
    'name': 'password',
    'message': 'Password: '
  }])
}

function query(base, email, password) {
  const url = `${base}/signup`;
  const data = {
    firstname: email.split('@')[0],
    lastname: email.split('@')[0],
    email: email,
    password: password,
    accept: 'true'
  }
  return Communication.post(url, data);
}

export default exec
