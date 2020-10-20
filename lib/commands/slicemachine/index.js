import {
  pull,
  ls,
  develop,
  endpoint,
  setup,
  bootstrap,
  createSlice,
  help,
  addStorybook,
} from './commands';
import { ctx as context } from '../../context';

function index(ctx = context) {
  if (ctx.SliceMachine.setup) return setup();
  else if (ctx.SliceMachine.bootstrap) return bootstrap();
  else if (ctx.SliceMachine.develop) return develop();
  else if (ctx.SliceMachine.ls) return ls();
  else if (ctx.SliceMachine.createSlice) return createSlice();
  else if (ctx.SliceMachine.addStorybook) return addStorybook();
  else if (ctx.SliceMachine.pull) return pull();
  else if (ctx.SliceMachine.apiEndpoint && typeof ctx.SliceMachine.apiEndpoint === 'boolean') return endpoint();
  return help();
}


export default index;
