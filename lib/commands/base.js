import inquirer from 'inquirer';
import localDB from '../services/localDB';

function prompt(newBase) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'base',
      message: 'New base domain: (staff only, ex: https://prismic.io )',
      default: newBase,
    },
  ]);
}

async function exec(newBase) {
  const res = newBase ? Promise.resolve({ base: newBase }) : prompt();
  return res.then(answers => (
    localDB.set({
      base: answers.base,
      cookies: '', // clear the cookie because it won't be valid with the new base
    }).then(() => answers.base)
  )).catch((err) => {
    process.stdout.write(`Error: ${err}\n`);
  });
}

export default exec;
