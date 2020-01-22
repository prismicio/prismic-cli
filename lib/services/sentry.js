
import globals from '../globals';
import { ctx } from '../context';

const Sentry = require('@sentry/node');

export default {
  init() {
    Sentry.init({ dsn: globals.SENTRY_DSN });
    Sentry.configureScope((scope) => {
      if (ctx && ctx.Auth.email) {
        scope.setUser({ email: ctx.Auth.email });
      }
    });
  },

  async report(err, tag) {
    if (!err) return;
    Sentry.configureScope((scope) => {
      scope.setExtra('context', ctx);
    });
    Sentry.captureException(err, { tags: { [tag]: tag } });
  },

  await(callback) {
    console.log('await');
    function _exec() {
      const isProcessing = Sentry.getCurrentHub().getClient()._processing;
      console.log('isprocessing => ', isProcessing);
      if (isProcessing) {
        setTimeout(_exec, 300);
      } else {
        callback();
      }
    }
    _exec();
  },
};

// client.captureException(ex, {
//   message: 'This is a test message generated using ``raven test``',
//   level: 'info',
//   logger: 'sentry.test',
//   transaction: 'bin:raven at main',
//   request: {
//     method: 'GET',
//     url: 'http://example.com'
//   },
//   extra: {
//     user: process.getuid && process.getuid(),
//     loadavg: os.loadavg()
//   }
// });
