import {
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
  if (ctx.SliceMachine.bootstrap) return bootstrap();
  if (ctx.SliceMachine.develop) return develop();
  if (ctx.SliceMachine.ls) return ls();
  if (ctx.SliceMachine.createSlice) return createSlice();
  if (ctx.SliceMachine.addStorybook) return addStorybook();
  if (ctx.SliceMachine.apiEndpoint && typeof ctx.SliceMachine.apiEndpoint === 'boolean') return endpoint();
  return help();
}

export default index;
