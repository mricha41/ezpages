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
            <li>The surface of area of attack is pretty small by default. Securing it will likely require much less effort.</li>
            <li>Of course this depends on your particular use case, but the number of dependencies is more or less as low as you want it to be.</li>
        </ul>
    </li>
</ul>

## Quick Start

First, clone the repository. After you clone it, you've got some choices. By default, the project is set up to be served over HTTPS and you should keep it that way. You will need to create local certificates and store them in the location of your choosing. You will also need to load them into the environment somehow. `Node.js 20.6.0+` fully support `.env` files for loading environment variables. These are currently the minimum required environment variables:

```
NODE_ENV=development
HOST=127.0.0.1
PORT=443
KEY=path\to\your\certs\key.pem
CERT=path\to\your\certs\cert.pem
```

If you're stuck on Node.js versions lower than that, you may need to load secrets using the native format. On Windows, use a `env.bat` file to store secrets locally. On Mac/Linux, use a `env.sh` file to store them. Use the syntax that is appropriate for your platform, which is probably `set VARIABLE=value` on Windows or `export VARIABLE=value` on Mac/Linux. <u>**In addition**</u>, add `ENV_LEGACY=true` to your bash or batch script.

Once you've created the secrets file, run `npm install`. Start the app using `npm run dev`. When you want to build the front-end with Vite, use `npm run build`. Platform-specific scripts are available if you are stuck on a lower version of Node.js. They are appended with `windows` for Windows and `linux` for Mac/Linux.

## Documentation

