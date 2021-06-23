import { Server as ServerType } from 'http';
import * as Koa from 'koa';
const bodyParser = require('koa-bodyparser');


let _server: ServerType | null = null

export const Server = {
  start: (port: number, handler: (ctx: Koa.Context) => void) => {
    if (_server) return

    // Construct the APP
    const app = new Koa();
    app.use(bodyParser())
    app.use(async (ctx: Koa.Context) => handler(ctx));

    // Listen
    _server = app.listen(port)
  },
  stop: () => {
    if (_server) {
      _server.close()
      _server = null;
    }
  }
}