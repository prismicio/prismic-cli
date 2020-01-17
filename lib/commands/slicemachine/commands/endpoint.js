import inquirer from 'inquirer';
import localDB from '../../localDB';
import Helpers from '../../helpers';
import createEndpoints from '../misc/createEndpoints'

function prompt(currentEndpoint) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'endpoint',
      message: `New endpoint: (current: ${currentEndpoint} )`,
      default: null,
      validate: function(input) {
        return !!input.length
      }
    },
  ]);
}

async function exec(newEndpoint) {
  const Endpoints = await createEndpoints();
  const res = newEndpoint ? Promise.resolve({ endpoint: newEndpoint }) : prompt(Endpoints.SliceMachine.api());
  return res.then(async answers => {
    await localDB.set({
      apiEndpoint: answers.endpoint,
    });
    Helpers.UI.display(`New slice-machine api endpoint: ${answers.endpoint}`);
    return answers.endpoint;
  })
  .catch((err) => {
    process.stdout.write(`Error: ${err}\n`);
  });
}

export default exec;
