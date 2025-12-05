import process from 'process';
import fs from 'fs/promises';
import Debug from 'debug';
const debug = Debug('personal-site:server');
import https from 'https';
import createError from 'http-errors';
import express from 'express';
import { createServer as viteCreateServer}  from 'vite';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import favicon from 'serve-favicon';
import helmet from 'helmet';
import winston from 'winston';

import { indexRouter } from './routes/index/index.js';
import { contentApiRouter } from './routes/api/content/content.js';

//this is here for now to support older
//versions of Node that do not provide support
//for loading .env files
if (!process.env.ENV_LEGACY) {
  process.loadEnvFile("./src/server/.env");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(`Running in [${process.env.NODE_ENV}] mode`);

if (process.env.NODE_ENV === "development") {
  
  console.log(`Root folder: ${path.join(__dirname, '../..')}`)
  
  console.log(path.resolve(path.join(__dirname)));
  //console.log(process.env);

}

var port = normalizePort(process.env.PORT || '3000');

let key = await fs.readFile(`${process.env.KEY}`);
let cert = await fs.readFile(`${process.env.CERT}`);

var options = {
  key: key,
  cert: cert
};

var app = express();
app.set('port', port);
var server = https.createServer(options, app);

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

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

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
      },
    },
  }),
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
        },
      },
    }),
  );

}

app.disable("x-powered-by");

app.use('/', indexRouter);
app.use('/api/content', contentApiRouter);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: number | string) {
  var port = typeof val === "string" ? parseInt(val, 10) : val;

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error: NodeJS.ErrnoException) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : addr ? 'port ' + addr.port : null;
  debug('Listening on ' + bind);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'downloads')));
app.use(express.static(path.join(__dirname, 'push')));
app.use(express.static(path.join(__dirname, 'dist')));

if (process.env.NODE_ENV === "development") {
  app.use(express.static(path.join(__dirname, '../..')));
}

// catch 404 and forward to error handler
// @ts-ignore
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// @ts-ignore
app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err });
});
