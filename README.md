# ezpages


A no-frills tool for authoring web content focused on simplicity and flexibility.

## Why Should I use ezpages?

if you're anything like me, you've grown tired of the relentless adoption of complicated solutions to fairly simple problems. Here is a short list of reasons you may want to use this project to bootstrap your own:

<ul>
    <li>
        You are working alone.
        <ul>
            <li>Collaboration usually requires more complexity. Usually editors, maybe a one-click installer, some kind of DevOps plan...and the list goes on.</li>
            <li>There's a strong probability you do not need authentication/authorization if you are on your own.</li>
        </ul>
    </li>
    <li>
        Your content is generally short and simple.
        <ul>
            <li>If you're looking to stuff copious amounts of ads and UI elements in each page, eh...maybe use something else.</li>
        </ul>
    </li>
    <li>
        You want a tool that does a couple things pretty well and mostly stays out of your way.
        <ul>
            <li>The intention here is to provide a simple solution to serving up some pages with the option of adding complexity as you go.</li>
            <li>You will not find much in the way of fancy data structures and algorithms here. Those are for you to implement at your own discretion! 😁</li>
        </ul>
    </li>
    <li>
        You want a solution that is easy to secure.
        <ul>
            <li>The surface area of attack is pretty small by default. Securing it will likely require much less effort.</li>
            <li>Of course this depends on your particular use case, but the number of dependencies is more or less as low as you want it to be.</li>
        </ul>
    </li>
</ul>

## Quick Start

First, clone the repository. After you clone it, you've got some choices. By default, the project is set up to be served over HTTPS and you should keep it that way. You will need to create local certificates and store them in the location of your choosing. You will also need to load them into the environment somehow. `Node.js 20.6.0+` fully supports `.env` files for loading environment variables. These are currently the minimum required environment variables:

```
NODE_ENV=development
HOST=127.0.0.1
PORT=443
KEY=path\to\your\certs\key.pem
CERT=path\to\your\certs\cert.pem
```

If you're stuck on Node.js versions lower than that, you may need to load secrets using the native format. On Windows, use a `env.bat` file to store secrets locally. On Mac/Linux, use a `env.sh` file to store them. Use the syntax that is appropriate for your platform, which is probably `set VARIABLE=value` on Windows or `export VARIABLE=value` on Mac/Linux. <u>**In addition**</u>, add `ENV_LEGACY=true` to your bash or batch script.

Once you've created the secrets file, run `npm install`. Start the app using `npm run dev`. When you want to build the front-end with Vite, use `npm run build`. Platform-specific scripts are available if you are stuck on a lower version of Node.js. They are appended with `windows` for Windows and `linux` for Mac/Linux.

## Server Docs

### Server Config

You will need to create an `app.ts` file in the top-level server folder at `/src/server` and initialize the ezpages server class. This class, cleverly named `EzPagesServer`, has configuration options you can set on construction. This includes some hooks you can assign that fire at various stages when ezpages spins up the HTTPS server, Express, and also Vite. Here is an example of what basic initialization looks like:

```

import { EzPagesServer } from './ezpages.js';

const app = new EzPagesServer();
app.Serve();

```

Here's a not-so-basic example of ezpages initialization:

```

import https from 'https';
import express from 'express';
import { Server } from 'https';
import { createServer as viteCreateServer}  from 'vite';

import { logger } from './logger.js';
import { EzPagesServer, EzPagesServerOptions, EzPagesServerContext } from './ezpages.js';

function ExampleExpressCreateAppHook () {

    logger.info("Running Express hook...");

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

    logger.info("Running Vite server hook...");

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

    logger.info("Running HTTPS server hook...");

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
};

const app = new EzPagesServer(example_options);
//const app = new EzPagesServer(example_bad_options);

app.Serve();

```

EzPagesServerOptions can be imported from `ezpages.ts`, which will inform you on all of the relevant options and hooks you might need.

### Content

Your content is culled from the `/src/server/content` folder. There is some placeholder content illustrating the basics, such as how to structure folders and files, how nested folders might work for you, and a few other bits and pieces. Replace this content as you see fit, paying attention to that basic structure. The only file you must have is an `index.md` or `index.html` file for your top-level page. Don't worry if you delete all the files and folders and forget to add `index.md` - you'll get a nice reminder.

Content types supported include [Markdown](https://daringfireball.net/projects/markdown/syntax) and HTML - that's it. You will need some kind of editor for authoring content (I use VS Code's built-in previewer for markdown, and of course it also supports HTML).

While you can keep stuffing content into subfolders deeper than the [Mariana Trench](https://en.wikipedia.org/wiki/Mariana_Trench), I'd suggest you keep it relatively sane. That said, there is a mechanism for constructing a giant JSON object and storing it in a file in the `/src/server/content` folder with the clever name `content.json`. It receives no special treatment other than it speeds up requests by virtue of the fact that it exists.

When building with the supplied script or starting up the server, a rebuild of your content will automatically trigger and serialize to `content.json` if it does not exist. If you made updates to the content, just delete `content.json` and the next time the server starts or a request is made to `/api/content` it will trigger a rebuild of `content.json`.

Lastly, your total content size should be commensurate with what is reasonable for your users to request. This is because the size of the payload is directly proportional to the amount of content you have. If you find that you have more than is reasonable to request, congratulations I guess - you get to upgrade to one of the many full-featured CMS solutions available. You could also choose to hack on this simple solution further and split your content across whatever lines makes sense in your situation and serve it differently. 

### Static Assets

At it's heart, ezpages is just an Express app. Static assets go in the public folder by default and can be referenced in your content from that location.

### Routing

There are only two routes by default - `/` and `/api/content`. Should you require more routes, you can use the Express hook available when constructing the `EzPagesServer` class.

### 🎛️ Content Config 🎛️

Each content file may have a corresponding config file with various options. See the included `index.json` for an example of what that would look like. Currently, page-level options include:

#### <u>Metadata Options</u>

* title: string
* description: string

Metadata options are set on-the-fly as users click on content links to aid with search engine optimization (SEO). Fire up the page inspector in your favorite browser and watch as you click around to observe which values change.

#### <u>Content Options</u>

* content_type: string ("html" or "markdown")
* layout: string ("simple", "nested" or any value you wish to support directly on the client side)

The content `layout` option is largely ignored by the server. Implementations are included for "simple" and "nested" layouts on the client. You can provide any other value as long as you write the supporting code to render that particular layout. See the existing implementations for hints about how you might do this. The `content_type` option is used solely on the server side and basically determines whether or not the [marked library](https://github.com/markedjs/marked) is used to parse the content or not before storing it.

## Client Docs

### Content Manager

There is a `Content` class responsible for wrangling and storing your content. All of your content is aggregated on the back end at the `api/content` endpoint from the files and folders mentioned in the content section above. Once it is aggregated it is sent to the client where the `Content` class brokers all of the content-related actions you might take.

### Extending the Content Manager Class

Todo

### Content Layouts

Simple layout templating is in place on the front end. There is no back-end templating language to deal with, rather the layout style and its implementation are handled solely in the browser.

In particular, heavily nested content will require your expertise in determining exactly how it should be rendered. Trying to write a generic layout routine for everything under the sun struck me as an exercise in futility. Only content nested two folders deep is handled in the "nested" layout implementation provided, and it is not necessarily what you are looking for either. Look to the source code that implements this layout to inform how you might move forward with a custom layout routine.

### Extending Content Layouts

Todo

### Routing

Fairly simple front-end routing handles page loads without the need for the user to refresh. The following documentation should tell you what you need to know as far as using and extending its capabilities:

[History API](https://developer.mozilla.org/en-US/docs/Web/API/History)

Some care was taken to update the title attribute and page metadata as the user clicks around. However, front-end routing can complicate your SEO situation and more work is likely necessary to make your app benefit from SEO best practices.


Happy hacking! ⌨️🍵