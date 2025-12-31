import process from 'process';
import { performance } from 'node:perf_hooks';
import fs from 'fs/promises';
import Debug from 'debug';
import https from 'https';
import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as viteCreateServer}  from 'vite';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import favicon from 'serve-favicon';
import helmet from 'helmet';

import { logger, LogRequest } from './logger.js';
import { indexRouter } from './routes/index/index.js';
import { contentApiRouter } from './routes/api/content/content.js';

const debug = Debug('ezpages:server');

//this is here for now to support older
//versions of Node that do not provide support
//for loading .env files
if (!process.env.ENV_LEGACY) {
  process.loadEnvFile("./src/server/.env");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

logger.info(`Running in [${process.env.NODE_ENV}] mode`);

if (process.env.NODE_ENV === "development") {
  
  logger.info(`Root folder: ${path.join(__dirname, '../..')}`)
  
  logger.info(path.resolve(path.join(__dirname)));

}

let port = process.env.PORT || '3000';

let key = await fs.readFile(`${process.env.KEY}`);
let cert = await fs.readFile(`${process.env.CERT}`);

let options = {
  key: key,
  cert: cert
};

let app = express();
app.set('port', port);
let server = https.createServer(options, app);

if (process.env.NODE_ENV === "development") {

    const viteServer = await viteCreateServer({
    appType: 'custom',
    server: {
        middlewareMode: true,
        hmr: {
            server
        }
    }
    });

    app.use(viteServer.middlewares);

}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

server.on('error', (error: NodeJS.ErrnoException) => {
  
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }

});

server.on('listening', () => {

  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : addr ? 'port ' + addr.port : null;
  debug('Listening on ' + bind);

});

app.disable("x-powered-by");

app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

if (process.env.NODE_ENV === "development") {

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          //wss is for vite web socket
          "connect-src": ["'self'", `wss://${process.env.HOST}:${process.env.PORT}`],
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
    })
  );

} else {

  app.use(
    helmet({
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
    })
  );

}

//static asset folders must be used before routing
//for api and index page due to the catch-all /{*splat}
//used by indexRouter - otherwise resources will not be served
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

function logRequest (req: LogRequest, res: Response, next: NextFunction) {

  const start = performance.now();
  
  const requestId = req.headers["x-request-id"];
  const { method, url, ip, headers } = req;
  const userAgent = headers["user-agent"];

  req.log = logger.child({
    request_id: requestId,
  });

  req.log.info(`incoming ${method} request to ${url}`, {
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
      req.log.error("server error", logData);
    } else if (statusCode >= 400) {
      req.log.warn("client error", logData);
    } else {
      req.log.info("request completed", logData);
    }
  });

  next();
  
}

app.use((req: Request, res: Response, next: NextFunction) => {
  logRequest(req as LogRequest, res, next);
});

app.use('/api/content', contentApiRouter); //ensure this always remains before indexRouter so it will catch api traffic before indexRouter
app.use('/', indexRouter); //indexRouter should be last, as it uses /{*splat} to catch all traffic and ensure it is served the index page template

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use(function(_req: Request, _res: Response, next) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, _next: NextFunction) {
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err });

});

server.listen(port);
