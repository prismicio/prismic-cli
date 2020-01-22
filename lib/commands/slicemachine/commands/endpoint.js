import inquirer from 'inquirer';
import Helpers from '../../../helpers';
import createEndpoints from '../misc/createEndpoints';
import { setSlicemachineEndpoint } from '../../../context';
import Sentry from '../../../services/sentry';


function prompt(currentEndpoint) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'endpoint',
      message: `New endpoint: (current: ${currentEndpoint} )`,
      validate: input => (!!input.length),
    },
  ]);
}

async function exec() {
  const Endpoints = await createEndpoints();
  const res = prompt(Endpoints.SliceMachine.api());
  return res
    .then(async (answers) => {
      await setSlicemachineEndpoint(answers.endpoint);
      Helpers.UI.display(`New slice-machine api endpoint: ${answers.endpoint}`);
      return answers.endpoint;
    })
    .catch((err) => {
      Sentry.report(err, 'slicemachine-set-endpoint');
      process.stdout.write(`Error: ${err}\n`);
    });
}

export default exec;
