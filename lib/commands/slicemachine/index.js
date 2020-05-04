import {
  sync,
  ls,
  endpoint,
  init,
  createSlice
} from './commands';
import { ctx } from '../../context';

function index() {
  if (ctx.SliceMachine.ls) {
    return ls();
  }
  if (ctx.SliceMachine.createSlice) {
    return createSlice();
  }
  if (ctx.SliceMachine.sync) {
    return sync();
  } else if (ctx.SliceMachine.apiEndpoint) {
    if (typeof ctx.SliceMachine.apiEndpoint === 'boolean') return endpoint();
  }
  return init();
}


export default index;
