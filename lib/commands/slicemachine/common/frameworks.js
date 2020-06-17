import { ctx } from '../../../context';

export default {
  get() {
    if (ctx.SliceMachine.framework) return ctx.SliceMachine.framework;
    throw new Error('[Error] Please specify a framework by using `--framework <framework_name>`');
  },
};
