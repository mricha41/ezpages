import express from 'express';
import { logger } from './logger.js';
import { EzPagesServer } from './ezpages.js';

function ExpressSetup () {

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

const app = new EzPagesServer({
    host: "127.0.0.1",
    port: "443",
    express_hook: ExpressSetup
});
app.Serve();