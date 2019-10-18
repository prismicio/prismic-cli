import { init } from './init';
import { sync } from './commands';

export default (config, args) => {
  if (args['--sync']) {
    return sync(config, args);
  }
  return init(config, args);
};
