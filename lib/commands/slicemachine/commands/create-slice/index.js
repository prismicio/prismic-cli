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
        const isPascal = /^[A-Z][A-Za-z]*$/.test(value);
        if (!isPascal) {
          return 'Value has to be PascalCased';
        }
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
  if (!framework) {
    throw new Error('Unable to get framework value from project tree');
  }
  const lib = ctx.SliceMachine.localLibrary ? Libraries.formatLibPath(ctx.SliceMachine.localLibrary) : await Libraries.selectLocal();
  const { pathToSlices: libPath } = Libraries.infos(lib);
  const { sliceName } = ctx.SliceMachine.sliceName ? ctx.SliceMachine : await Prompts.componentName(libPath);

  try {
    const templatePath = (() => {
      if (ctx.SliceMachine.templatePath) {
        return path.join(process.cwd(), ctx.SliceMachine.templatePath);
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

    // await Slices.createRemote(prismicEndpoint, sliceName, templatePath);
    await Slices.createLocal(sliceName, /* modelWithPath */ null, libPath, templatePath);
  } catch (e) {
    return consola.error(e.message);
  }

  console.log(`\n✅ ${framework} slice created at ${libPath}!`);

  const prismicEndpoint = Endpoints.Prismic.fromCtxOrConfig();
  if (prismicEndpoint) {
    return console.log(`Use it right away 👉 ${Endpoints.Prismic.documentsList(prismicEndpoint)}`);
  }
  console.log('To use it in your project, please add a valid Prismic endpoint to your configuration file');
}
