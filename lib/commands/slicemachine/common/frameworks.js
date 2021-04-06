import { ctx } from '../../../context';
import { detect as detectFramework, parse as parseFramework } from '../../../common/framework';

export default {
  get() {
    const framework = (() => {
      if (ctx.SliceMachine.framework) {
        const parsed = parseFramework(ctx.SliceMachine.framework);
        if (parsed) return parsed;
      }
      return detectFramework();
    })();

    if (!framework) console.error('[Error] Please specify a framework by using `--framework <framework_name>`');
    return framework;
  },
};
