import { Server as ServerHttp } from 'http'
import * as Koa from 'koa';
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');


export const DEFAULT_PORT = 5555
type LoginResponse = {
  email: string,
  cookies: Array<string>
}


var server: ServerHttp | null = null;

// The server will be shutdown automatically when the current Command is finished.
export const Server = {
  start: (base: string, port: number, handler: (ctx: Koa.Context) => void) => {
    // Construct the APP
    const app = new Koa();
    app.use(cors({ origin: base }));
    app.use(bodyParser());
    app.use(async (ctx: Koa.Context) => handler(ctx));

    // Listen
    server = app.listen(port);
  },
  stop: () => server?.close((error) => {
    if (error) console.log(`Error shuting down the local server: ${error}`)
  })
}