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
  const Endpoints = createEndpoints();
  const answers = await prompt(Endpoints.SliceMachine.api());
  setSlicemachineEndpoint(answers.endpoint);
  Helpers.UI.display(`New slice-machine api endpoint: ${answers.endpoint}`);
  return answers.endpoint;
}

export default exec;
