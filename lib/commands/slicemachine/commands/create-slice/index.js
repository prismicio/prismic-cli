import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import consola from 'consola';
import { hyphenate } from 'sm-commons/utils/str';

import { ctx } from '../../../../context';
import getFramework from '../../methods/getFramework';
import Libraries from '../../common/libraries';
import Endpoints from '../../misc/endpoints';
import Slices from '../../common/slices';

const Prompts = {
  componentName(pathToCreate) {
    return inquirer.prompt([{
      type: 'text',
      name: 'sliceName',
      message: 'Enter the name of your slice (2 words, PascalCased)',
      initial: 'eg. LargeHeader',
      prefix: '🍕',
      validate: (value) => {
        if (fs.existsSync(path.join(pathToCreate, value))) {
          return 'Slice exists already, pick another name';
        }
        const kebabCased = hyphenate(value);
        if (kebabCased.indexOf('-') < 1) {
          return 'Value has to be 2-worded when transformed into kebab-case.\neg. \'LargeHeader\' would become \'large-header\'';
        }
        return true;
      },
    }]);
  },
};

/* eslint-disable  consistent-return */
export default async function () {
  const framework = await getFramework(ctx.SliceMachine);
  const lib = await Libraries.selectLocal();
  const { pathToSlices: libPath } = Libraries.infos(lib);
  const { sliceName } = await Prompts.componentName(libPath);

  const prismicEndpoint = Endpoints.Prismic.fromCtxOrConfig();
  if (!prismicEndpoint) {
    throw new Error('Unable to retrieve your Prismic endpoint.\nPlease re-run this command with: --endpoint <your-prismic-api-endpoint> or --domain <your-prismic-domain>');
  }

  try {
    const templatesPath = path.join(__dirname, '../../templates');
    await Slices.createRemote(framework, prismicEndpoint, sliceName, templatesPath);
    await Slices.createLocal(framework, sliceName, /* modelWithPath */ null, libPath, templatesPath);
  } catch (e) {
    return consola.error(e.message);
  }

  console.log(`\n✅ ${framework} slice created at ${libPath}!`);

  console.log(`Use it right away 👉 ${Endpoints.Prismic.documentsList(prismicEndpoint)}`);
}
