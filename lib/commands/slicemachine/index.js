import {
  sync,
  ls,
  endpoint,
  init,
  createSlice,
  help,
} from './commands';
import { ctx } from '../../context';

function index() {
  if (ctx.SliceMachine.setup) return init();
  else if (ctx.SliceMachine.ls) return ls();
  else if (ctx.SliceMachine.createSlice) return createSlice();
  else if (ctx.SliceMachine.sync) return sync();
  else if (ctx.SliceMachine.apiEndpoint && typeof ctx.SliceMachine.apiEndpoint === 'boolean') return endpoint();
  return help();
}


export default index;
