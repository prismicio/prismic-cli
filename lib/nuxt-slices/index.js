import { init } from './init';
import { sync, endpoint } from './commands';

export default (config, args) => {
  if (args['--sync']) {
    return sync(config, args);
  }
  if (args['--endpoint']) {
    const param = typeof args['--endpoint'] === 'boolean' ? null : args['--endpoint'];
    return endpoint(param);
  }
  return init(config, args);
};
