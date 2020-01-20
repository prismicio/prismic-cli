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
  return res.then(async (answers) => {
    const trimmedBase = answers.base.trim();
    await setBase(trimmedBase);
    await setCookies('');
    return trimmedBase;
  }).catch((err) => {
    process.stdout.write(`Error: ${err}\n`);
  });
}

export default exec;
