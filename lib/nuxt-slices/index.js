import { init } from './init';
import { sync, endpoint } from './commands';

async function index(config, args) {
  if (args['--sync']) {
    await sync(config, args);
  } else if (args['--endpoint']) {
    const param = typeof args['--endpoint'] === 'boolean' ? null : args['--endpoint'];
    await endpoint(param);
  } else {
    await init(config, args);
  }
  process.exit(0);
}


export default index;
