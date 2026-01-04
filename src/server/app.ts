import https from 'https';
import express from 'express';
import { Server } from 'https';
import { createServer as viteCreateServer}  from 'vite';

import { logger } from './logger.js';
import { EzPagesServer, EzPagesServerOptions, EzPagesServerContext } from './ezpages.js';

function ExampleExpressCreateAppHook () {

    console.log("Running express hook...");

    try {

      let express_app = express();
      express_app.set('port', '443');
    
      return express_app;

    } catch (error) {

      logger.error("Failed to create the Express app.", { error: error });
      return null;

    }

}

async function ExampleViteServerHook (server: Server) {

    console.log("Running Vite server hook...");

    return viteCreateServer({
        appType: 'custom',
        server: {
            middlewareMode: true,
            hmr: {
                server
            }
        }
    });
}

function ExampleCreateServerHook (context: EzPagesServerContext, options: EzPagesServerOptions) {

    console.log("Running HTTPS server hook...");

    try {
    
        if (options.ssl_options) {

        let server = context.express_app ? https.createServer(options.ssl_options, context.express_app) : null;

        return server;

        } else {

            logger.error("HTTPS requires SSL options be set.", { ssl_options: options.ssl_options });
            return null;

        }

    } catch (error) {

        logger.error("Failed to create HTTPS server.", { error: error });
        return null;

    }

}

//@ts-ignore
const example_options = {
    host: "127.0.0.1",
    port: "443",
    express_hook: ExampleExpressCreateAppHook,
    https_server_hook: ExampleCreateServerHook,
    vite_server_hook: ExampleViteServerHook
};

//@ts-ignore
const example_bad_options = {
    host: "", //internally defaults to 127.0.0.1 if you provide a bad value
    port: "", //internally defaults to 443 if you provide a bad value
    express_hook: () => null, //valid return value, bad initialization for Express!
    https_server_hook: (_context: EzPagesServerContext, _options: EzPagesServerOptions) => null, //valid return value, bad initialization for HTTPS server!
    vite_server_hook: (_server: Server) => null, //valid return value, bad initialization for Vite server!
}

const app = new EzPagesServer();
//const app = new EzPagesServer(example_options);
//const app = new EzPagesServer(example_bad_options);

app.Serve();