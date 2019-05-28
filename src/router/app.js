import Koa    from 'koa';          // Koa framework
import jwt    from 'jsonwebtoken'; // JSON Web Token implementation
import xmlify from 'xmlify';       // JS object to XML
import yaml   from 'js-yaml';      // JS object to YAML
import Debug  from 'debug';        // small debugging utility

const debug = Debug('app:req'); // debug each request

import Log        from '../lib/log.js';
import Middleware from '../lib/middleware.js';


import author     from './authors.js';
import routesRoot from './routes-root.js';
import routesAuth from './routes-auth.js';


const app = new Koa();

app.use(async function logAccess(ctx, next) {
    debug(ctx.request.method.padEnd(4) + ' ' + ctx.request.url);
    const t1 = Date.now();
    await next();
    const t2 = Date.now();

    await Log.access(ctx, t2 - t1);
});
app.use(async function contentNegotiation(ctx, next) {
    await next();

    if (!ctx.response.body) return; // no content to return

    // check Accept header for preferred response type
    const type = ctx.request.accepts('json', 'xml', 'yaml', 'text');

    switch (type) {
        case 'json':
        default:
            delete ctx.response.body.root; // xml root element
            break; // ... koa takes care of type
        case 'xml':
            ctx.response.type = type;
            const root = ctx.response.body.root; // xml root element
            delete ctx.response.body.root;
            ctx.response.body = xmlify(ctx.response.body, root);
            break;
        case 'yaml':
        case 'text':
            delete ctx.response.body.root; // xml root element
            ctx.response.type = 'yaml';
            ctx.response.body = yaml.dump(ctx.response.body);
            break;
        case false:
            ctx.throw(406); // "Not acceptable" - can't furnish whatever was requested
            break;
    }
});
app.use(async function handleErrors(ctx, next) {
    try {

        await next();

    } catch (err) {
        ctx.response.status = err.status || 500;
        switch (ctx.response.status) {
            case 204: // No Content
                break;
            case 401: // Unauthorized
                ctx.response.set('WWW-Authenticate', 'Basic');
                break;
            case 403: // Forbidden
            case 404: // Not Found
            case 406: // Not Acceptable
            case 409: // Conflict
                ctx.response.body = { message: err.message, root: 'error' };
                break;
            default:
            case 500: // Internal Server Error (for uncaught or programming errors)
                console.error(ctx.response.status, err.message);
                ctx.response.body = { message: err.message, root: 'error' };
                if (app.env != 'production') ctx.response.body.stack = err.stack;
                // ctx.app.emit('error', err, ctx); // github.com/koajs/koa/wiki/Error-Handling
                break;
        }
        await Log.error(ctx, err);
    }
});
app.use(Middleware.ssl({ trustProxy: true }));
app.use(routesRoot);
app.use(routesAuth);
app.use(Middleware.verifyJwtApi());
app.use(author);

export default app;
