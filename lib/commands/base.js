import inquirer from 'inquirer';
import { setBase, setCookies } from '../context';

function prompt() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'base',
      message: 'New base domain: (staff only, ex: https://prismic.io )',
      validate(value) {
        return value && value.length > 0;
      },
    },
  ]);
}

async function exec() {
  const res = prompt();
  return res.then((answers) => {
    const saveBase = setBase(answers.base);
    const saveCookies = setCookies('');
    return Promise.all([saveBase, saveCookies])
      .then(() => answers.base);
  }).catch((err) => {
    process.stdout.write(`Error: ${err}\n`);
  });
}

export default exec;
