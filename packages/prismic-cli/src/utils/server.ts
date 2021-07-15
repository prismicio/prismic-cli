import * as Koa from 'koa';
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');

// The server will be shutdown automatically when the current Command is finished.
export const Server = {
  start: (base: string, port: number, handler: (ctx: Koa.Context) => void) => {
    // Construct the APP
    const app = new Koa();
    app.use(cors({ origin: base }));
    app.use(bodyParser());
    app.use(async (ctx: Koa.Context) => handler(ctx));

    // Listen
    app.listen(port)
  }
}