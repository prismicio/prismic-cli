import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import consola from 'consola';
import { hyphenate } from 'sm-commons/utils/str';

import Libraries from '../../common/libraries';
import Frameworks from '../../common/frameworks';
import Endpoints from '../../misc/endpoints';
import Slices from '../../common/slices';
import { ctx } from '../../../../context';

const CUSTOM_TEMPLATE_DIR = 'slice-template';

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
  const framework = Frameworks.get();
  const lib = await Libraries.selectLocal();
  const { pathToSlices: libPath } = Libraries.infos(lib);
  const { sliceName } = await Prompts.componentName(libPath);

  const prismicEndpoint = Endpoints.Prismic.fromCtxOrConfig();
  if (!prismicEndpoint) {
    throw new Error('Unable to retrieve your Prismic endpoint.\nPlease re-run this command with: --endpoint <your-prismic-api-endpoint> or --domain <your-prismic-domain>');
  }

  try {
    const templatePath = (() => {
      const { templatePath } = ctx.SliceMachine;
      if (templatePath) {
        return path.join(process.cwd(), templatePath);
      }
      const customTemplatePath = path.join(process.cwd(), CUSTOM_TEMPLATE_DIR);
      if (fs.existsSync(customTemplatePath)) {
        return customTemplatePath;
      }
      return path.join(__dirname, '../../templates', framework);
    })();

    if (!fs.existsSync(path.join(templatePath, 'model.json'))) {
      throw new Error(`Custom template folder "${CUSTOM_TEMPLATE_DIR}" requires a "model.json" file. Please add one.`);
    }

    await Slices.createRemote(prismicEndpoint, sliceName, templatePath);
    await Slices.createLocal(sliceName, /* modelWithPath */ null, libPath, templatePath);
  } catch (e) {
    return consola.error(e.message);
  }

  console.log(`\n✅ ${framework} slice created at ${libPath}!`);

  console.log(`Use it right away 👉 ${Endpoints.Prismic.documentsList(prismicEndpoint)}`);
}
