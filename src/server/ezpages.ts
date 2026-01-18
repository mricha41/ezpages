import process from 'process';
import crypto from 'crypto';
import { performance } from 'node:perf_hooks';
import fs from 'fs/promises';
import https, { Server, ServerOptions } from 'https';
import createError, { HttpError } from 'http-errors';
import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer as viteCreateServer, ViteDevServer}  from 'vite';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import favicon from 'serve-favicon';
import helmet, { HelmetOptions } from 'helmet';

import { logger, LogRequest } from './logger.js';
import { indexRouter } from './routes/index/index.js';
import { contentApiRouter } from './routes/api/content/content.js';
import { LoadContentFromFile, LoadContentFromFolder, SerializeContent } from './utilities/content_utilities.js';

interface EzPagesServerOptions {
  node_env?: string,
  ssl_options?: ServerOptions,
  host?: string,
  port?: string,
  content_security_policy?: HelmetOptions,
  express_create_app_hook?: () => Express | null,
  https_server_hook?: (context: EzPagesServerContext, options: EzPagesServerOptions) => Server | null,
  https_server_error_hook?: (context: EzPagesServerContext) => void,
  vite_server_hook?: (server: Server) => Promise<ViteDevServer> | null,
  express_use_static_path_hook?: (context: EzPagesServerContext) => void,
  express_use_encoding_hook?: (context: EzPagesServerContext) => void,
  express_use_cors_hook?: (context: EzPagesServerContext) => void,
  express_use_route_hook?: (context: EzPagesServerContext) => void,
  express_error_forwarding_hook?: (context: EzPagesServerContext) => void,
  express_error_handling_hook?: (context: EzPagesServerContext) => void,
  request_hook?: (req: LogRequest, res: Response, next: NextFunction) => void,
  on_listen_hook?: (options: EzPagesServerOptions, context: EzPagesServerContext) => void
};

interface EzPagesServerContext {
  express_app: Express | null,
  vite_server: ViteDevServer | null,
  server: Server | null
};

class EzPagesServer {

  private __filename: string;
  private __dirname: string;
  
  private _options: EzPagesServerOptions = {};
  private _context: EzPagesServerContext | null;

  constructor (options: EzPagesServerOptions | null = null) {

    this._context = { express_app: null, vite_server: null, server: null };

    this.__filename = fileURLToPath(import.meta.url);
    this.__dirname = dirname(this.__filename);

    //this is here for now to support older
    //versions of Node that do not provide support
    //for loading .env files
    if (!process.env.ENV_LEGACY) {
      process.loadEnvFile(path.join(this.__dirname, ".env"));
    }
    
    this._options.node_env = options && options.node_env ? options.node_env : process.env.NODE_ENV || "development";
    this._options.host = options && options.host ? options.host : process.env.HOST || "127.0.0.1";
    this._options.port = options && options.port ? options.port : process.env.PORT || '3000';
    
    logger.info(`Running in [${this._options.node_env}] mode`);

    if (this._options.node_env === "development") {
      
      logger.info(`Root folder: ${path.join(this.__dirname, '../..')}`);
      
      logger.info(`EzPages module folder: ${this.__dirname}`);

    }

    this._options.ssl_options = options && options.ssl_options ? options.ssl_options : {};

    this._options.content_security_policy = options && options.content_security_policy ? options.content_security_policy : this.ContentSecurityPolicy();

    this._options.express_create_app_hook = options && typeof options.express_create_app_hook === 'function' ? options.express_create_app_hook : undefined;
    this._options.vite_server_hook = options && typeof options.vite_server_hook === 'function' ? options.vite_server_hook : undefined;
    this._options.https_server_hook = options && typeof options.https_server_hook === 'function' ? options.https_server_hook : undefined;
    this._options.https_server_error_hook = options && typeof options.https_server_error_hook === 'function' ? options.https_server_error_hook : undefined;
    this._options.express_use_route_hook = options && typeof options.express_use_route_hook === 'function' ? options.express_use_route_hook : undefined;
    this._options.express_use_cors_hook = options && typeof options.express_use_cors_hook === 'function' ? options.express_use_cors_hook : undefined;
    this._options.express_use_static_path_hook = options && typeof options.express_use_static_path_hook === 'function' ? options.express_use_static_path_hook : undefined;
    this._options.express_use_encoding_hook = options && typeof options.express_use_encoding_hook === 'function' ? options.express_use_encoding_hook : undefined;
    this._options.express_error_forwarding_hook = options && typeof options.express_error_forwarding_hook === 'function' ? options.express_error_forwarding_hook : undefined;
    this._options.express_error_handling_hook = options && typeof options.express_error_handling_hook === 'function' ? options.express_error_handling_hook : undefined;
    this._options.request_hook = options && typeof options.request_hook === 'function' ? options.request_hook : undefined;
    this._options.on_listen_hook = options && typeof options.on_listen_hook === 'function' ? options.on_listen_hook : undefined;

    try {
      
      LoadContentFromFile(path.join(process.cwd(), "src/server/content/content.json")).then((json) => {
        
        if (!json) {

          logger.info(`Content cache not found. Rebuilding and serializing content...`);

          LoadContentFromFolder(path.join(process.cwd(), "src/server/content")).then((content) => {
            SerializeContent(path.join(process.cwd(), "src/server/content/content.json"), content);
          });

        } else {

          logger.info(`Content cache found. Skipping content rebuild and serialization.`);
          
        }
        
      });

    } catch (error) {

      logger.warn(`Failed to load and serialize content - make sure content exists in the src/server/content folder.`, { error: error });

    }

  };

  public async Serve () {

    if (this._options.ssl_options && (!this._options.ssl_options.cert || !this._options.ssl_options.ca)) { //if ssl options empty/not passed in on construction...

      //try to get ssl options from .env
      this._options.ssl_options = await this.SSL_Options().catch((error) => {
        logger.error(error);
      }) || {}; //if ssl options are empty, browser will refuse to connect via ssl with some kind of "secure connection failed" error

    }
    
    if (this._context) {

      this._context.express_app = typeof this._options.express_create_app_hook === 'function' ? this._options.express_create_app_hook() : this.CreateExpressApp();
      this._context.server = typeof this._options.https_server_hook === 'function' ? await this._options.https_server_hook(this._context, this._options) : await this.CreateServer();

      if (this._options.node_env === "development" && this._context.server && this._context.express_app) {

        let viteServer = this._options.vite_server_hook ? await this._options.vite_server_hook(this._context.server) : await this.CreateViteServer(this._context.server);
        if (viteServer) {
          this._context.express_app.use(viteServer.middlewares);
        }

      }

      if (this._options.ssl_options && this._context.express_app && this._context.server) {

        // view engine setup
        this._context.express_app.set('views', path.join(this.__dirname, 'views'));
        this._context.express_app.set('view engine', 'ejs');

        if (this._options.https_server_error_hook) {

          this._options.https_server_error_hook(this._context);

        } else { //basic server error/crash handler

          this._context.server.on('error', (error: NodeJS.ErrnoException) => {
        
            if (error.syscall !== 'listen') {
              throw error;
            }

            //handle specific listen errors with friendly messages
            switch (error.code) {
              case 'EACCES':
                console.error(this._options.port + ' requires elevated privileges');
                process.exit(1);
              case 'EADDRINUSE':
                console.error(this._options.port + ' is already in use');
                process.exit(1);
              default:
                throw error;
            }

          });

        }

        this._context.express_app.disable("x-powered-by");

        this._context.express_app.use(favicon(path.join(this.__dirname,'public','images','favicon.ico')));

        this._context.express_app.use(helmet(this._options.content_security_policy));

        if (this._options.express_use_cors_hook) {
          this._options.express_use_cors_hook(this._context);
        }

        //static asset folders must be used before routing
        //for api and index page due to the catch-all /{*splat}
        //used by indexRouter - otherwise resources will not be served
        this._context.express_app.use(express.static(path.join(this.__dirname, 'public')));
        this._context.express_app.use(express.static(path.join(this.__dirname, 'dist')));

        //should more static paths need to be added
        //they will be added after the defaults
        if (this._options.express_use_static_path_hook) {
          this._options.express_use_static_path_hook(this._context);
        }

        this._context.express_app.use((req: Request, res: Response, next: NextFunction) => { //log every request

          this.LogAllRequests(req as LogRequest, res, next);

        });

        if (this._options.request_hook) { //with great power comes yadda yadda yadda...

            this._context.express_app.use((req: Request, res: Response, next: NextFunction) => {
              
              if (this._options.request_hook) { //for some reason ts does not trust the first check when called inside the outer function
                this._options.request_hook(req as LogRequest, res, next);
              }

            });

        }

        //should more routes need to be added
        //they will be added before the content api
        //and the catch-all to ensure that they execute
        if (this._options.express_use_route_hook) {
          this._options.express_use_route_hook(this._context);
        }

        this._context.express_app.use('/api/content', contentApiRouter); //ensure this always remains before indexRouter so it will catch api traffic before indexRouter
        this._context.express_app.use('/', indexRouter); //indexRouter should be last, as it uses /{*splat} to catch all traffic and ensure it is served the index page template

        this._context.express_app.use(express.json());
        this._context.express_app.use(express.urlencoded({ extended: false }));

        if (this._options.express_use_encoding_hook) {

          this._options.express_use_encoding_hook(this._context);
          
        }

        //HTTP error forwarding
        if (this._options.express_error_forwarding_hook) {

          this._options.express_error_forwarding_hook(this._context);

        } else { //not great, but at least it's something...

          this._context.express_app.use((_req: Request, _res: Response, next: NextFunction) => {
            next(createError(404));
          });

        }

        //HTTP error handling
        if (this._options.express_error_handling_hook) {

          this._options.express_error_handling_hook(this._context);

        } else { //yep, it's something at least

          this._context.express_app.use((err: HttpError, req: Request, res: Response, _next: NextFunction) => {
          
            //set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            //send an error response
            res.status(err.status || 500);
            res.json({ error: err });

          });

        }

        this._context.server.listen(this._options.port, () => {

          logger.info(`EZPages listening on https://${this._options.host}:${this._options.port}`);

          if (this._options.on_listen_hook && this._context) { //need to check if context created again because we're inside the lambda here

            this._options.on_listen_hook(this._options, this._context);

          }

        });

      } else {

        logger.warn("EzPages app failed to launch, make sure .env exists and check settings. KEY and CERT must be available at the given paths, ensure that the files exist.", { ssl_options: this._options.ssl_options });
        logger.warn("Check EzPages options if you provided them. Hooks need to take the required parameters and return the correct types. See docs and EzPages class source code for details on implementing hooks.", { options: this._options });

      }

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
      express_app.set('port', this._options.port);
    
      return express_app;

    } catch (error) {

      logger.error("Failed to create the Express app.", { error: error });
      return null;

    }

  }

  private async CreateServer () {

    try {

      if (this._options.ssl_options) {

        let server = this._context && this._context.express_app ? https.createServer(this._options.ssl_options, this._context.express_app) : null;

        return server;

      } else {

        logger.error("HTTPS requires SSL options be set.", { ssl_options: this._options.ssl_options });
        return null;

      }

    } catch (error) {

      logger.error("Failed to create HTTPS server.", { error: error });
      return null;

    }

  }

  private async CreateViteServer (server: Server) {

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

  private ContentSecurityPolicy () {

    if (this._options.node_env === "development") {

      return {
        contentSecurityPolicy: {
          useDefaults: false,
          directives: {
            //wss is for vite web socket
            "connect-src": ["'self'", `wss://${this._options.host}:${this._options.port}`],
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
      };

    } else {

      return {
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
      };

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

export { EzPagesServer, EzPagesServerOptions, EzPagesServerContext };