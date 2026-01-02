import process from 'process';
import crypto from 'crypto';
import { performance } from 'node:perf_hooks';
import fs from 'fs/promises';
import https from 'https';
import createError from 'http-errors';
import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer as viteCreateServer}  from 'vite';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import favicon from 'serve-favicon';
import helmet from 'helmet';

import { logger, LogRequest } from './logger.js';
import { indexRouter } from './routes/index/index.js';
import { contentApiRouter } from './routes/api/content/content.js';
import { Server, ServerOptions } from 'node:https';

class EzPagesServer {

  private __filename: string = "";
  private __dirname: string = "";
  private _node_env: string = "";
  private _ssl_options: ServerOptions | null = null;
  private _host: string = "";
  private _port: string = "";

  private _express_app: Express | null = null;
  private _server: Server | null = null;

  constructor () {};

  public async Serve () {

    this.__filename = fileURLToPath(import.meta.url);
    this.__dirname = dirname(this.__filename);

    //this is here for now to support older
    //versions of Node that do not provide support
    //for loading .env files
    if (!process.env.ENV_LEGACY) {
      process.loadEnvFile(path.join(this.__dirname, ".env"));
    }
    
    this._node_env = process.env.NODE_ENV || "development";
    this._host = process.env.HOST || "127.0.0.1";
    this._port = process.env.PORT || '3000';
    
    logger.info(`Running in [${this._node_env}] mode`);

    if (this._node_env === "development") {
      
      logger.info(`Root folder: ${path.join(this.__dirname, '../..')}`);
      
      logger.info(`EzPages module folder: ${this.__dirname}`);

    }

    this._ssl_options = await this.SSL_Options().catch((error) => {
      logger.error(error);
    }) || null;

    this._express_app = this.CreateExpressApp();
    this._server = await this.CreateServer();

    if (this._ssl_options && this._express_app && this._server) {

      // view engine setup
      this._express_app.set('views', path.join(this.__dirname, 'views'));
      this._express_app.set('view engine', 'ejs');

      this._server.on('error', (error: NodeJS.ErrnoException) => {
      
        if (error.syscall !== 'listen') {
          throw error;
        }

        // handle specific listen errors with friendly messages
        switch (error.code) {
          case 'EACCES':
            console.error(this._port + ' requires elevated privileges');
            process.exit(1);
          case 'EADDRINUSE':
            console.error(this._port + ' is already in use');
            process.exit(1);
          default:
            throw error;
        }

      });

      this._express_app.disable("x-powered-by");

      this._express_app.use(favicon(path.join(this.__dirname,'public','images','favicon.ico')));

      this._express_app.use(this.ContentSecurityPolicy());

      //static asset folders must be used before routing
      //for api and index page due to the catch-all /{*splat}
      //used by indexRouter - otherwise resources will not be served
      this._express_app.use(express.static(path.join(this.__dirname, 'public')));
      this._express_app.use(express.static(path.join(this.__dirname, 'dist')));

      this._express_app.use((req: Request, res: Response, next: NextFunction) => {
        this.LogAllRequests(req as LogRequest, res, next);
      });

      this._express_app.use('/api/content', contentApiRouter); //ensure this always remains before indexRouter so it will catch api traffic before indexRouter
      this._express_app.use('/', indexRouter); //indexRouter should be last, as it uses /{*splat} to catch all traffic and ensure it is served the index page template

      this._express_app.use(express.json());
      this._express_app.use(express.urlencoded({ extended: false }));

      // catch 404 and forward to error handler
      this._express_app.use((_req: Request, _res: Response, next: NextFunction) => {
        next(createError(404));
      });

      // error handler
      this._express_app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
        
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.json({ error: err });

      });

      this._server.listen(this._port, () => {

        logger.info(`EZPages listening on https://${this._host}:${this._port}`);

      });

    } else {

      logger.warn("EzPages app failed to launch, make sure .env exists and check settings. KEY and CERT must be available at the given paths, ensure that the files exist.", { ssl_options: this._ssl_options });

    }

  }

  private async SSL_Options () {

    let key = await fs.readFile(`${process.env.KEY}`).catch((error) => {
      throw error;
    });
    
    let cert = await fs.readFile(`${process.env.CERT}`).catch((error) => {
      throw error;
    });

    return {
      key: key,
      cert: cert
    };

  }

  private CreateExpressApp () {

    try {

      let express_app = express();
      express_app.set('port', this._port);
    
      return express_app;

    } catch (error) {

      logger.error("Failed to create the Express app.", { error: error });
      return null;

    }

  }

  private async CreateServer () {

    try {

      if (this._ssl_options) {

        let server = this._express_app ? https.createServer(this._ssl_options, this._express_app) : null;

        if (this._node_env === "development" && server && this._express_app) {

          await this.CreateViteServer(server, this._express_app);

        }

        return server;

      } else {

        logger.error("HTTPS requires SSL options be set.", { ssl_options: this._ssl_options });
        return null;

      }

    } catch (error) {

      logger.error("Failed to create HTTPS server.", { error: error });
      return null;

    }

  }

  private async CreateViteServer (server: Server, express_app: Express) {

        const viteServer = await viteCreateServer({
        appType: 'custom',
        server: {
            middlewareMode: true,
            hmr: {
                server
            }
        }
        });

        express_app.use(viteServer.middlewares);

  }

  private ContentSecurityPolicy () {

    if (this._node_env === "development") {

      return helmet({
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            //wss is for vite web socket
            "connect-src": ["'self'", `wss://${this._host}:${this._port}`],
            "default-src": ["'self'"],
            "script-src": ["'self'"],
            //unsafe-inline ONLY during development
            //production SHOULD use css LINK tags instead
            //of vite's css ESM style imports 
            //(import "./styles.css" for example)
            "style-src": ["'self'", "'unsafe-inline'"],
            "object-src": ["'none'"],
            "font-src": ["'self'"],
            "frame-src": ["'none'"],
            "frame-ancestors": ["'none'"]
          }
        }
      });

    } else {

      return helmet({
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            "connect-src": ["'self'"],
            "default-src": ["'self'"],
            "script-src": ["'self'"],
            "style-src": ["'self'"],
            "object-src": ["'none'"],
            "font-src": ["'self'"],
            "frame-src": ["'none'"],
            "frame-ancestors": ["'none'"]
          }
        }
      });

    }    

  }

  private LogAllRequests (req: LogRequest, res: Response, next: NextFunction) {

    const start = performance.now();
    
    const requestId = req.headers["x-request-id"] || crypto.randomUUID();
    const { method, url, ip, headers } = req;
    const userAgent = headers["user-agent"];

    req.logger = logger.child({
      request_id: requestId,
    });

    req.logger.info(`${method} request to ${url}`, {
      method,
      url,
      ip,
      user_agent: userAgent,
    });

    res.on("finish", () => {
      const { statusCode } = res;

      const logData = {
        duration_ms: performance.now() - start,
        status_code: statusCode,
      };

      if (statusCode >= 500) {
        req.logger.error("server error", logData);
      } else if (statusCode >= 400) {
        req.logger.warn("client error", logData);
      } else {
        req.logger.info("request completed", logData);
      }

    });

    next();
    
  }

}

export { EzPagesServer };