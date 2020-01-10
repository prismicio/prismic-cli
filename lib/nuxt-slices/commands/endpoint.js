import inquirer from 'inquirer';
import config from '../../config';
import Helpers from '../../helpers';
import Endpoints from '../misc/endpoints'

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
  const res = newEndpoint ? Promise.resolve({ endpoint: newEndpoint }) : prompt(Endpoints.SliceMachine.api());
  return res.then(answers => {
    config.set({
      apiEndpoint: answers.endpoint,
    }).then((c) => {
      Helpers.UI.display(`New slice-machine api endpoint: ${answers.endpoint}`);
    })
  })
  .catch((err) => {
    process.stdout.write(`Error: ${err}\n`);
  });
}

export default exec;
