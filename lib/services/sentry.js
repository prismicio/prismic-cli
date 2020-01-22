
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
    Sentry.captureException(err, {
      tags: { [tag]: tag },
    });
  },

  close(timeout, callback) {
    Sentry.getCurrentHub().getClient().close(timeout).then(callback);
  },
};
