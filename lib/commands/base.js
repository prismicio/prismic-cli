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
  const answers = await res;
  const trimmedBase = answers.base.trim();
  setBase(trimmedBase);
  setCookies('');
  return trimmedBase;
}

export default exec;
