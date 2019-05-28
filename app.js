import Koa             from 'koa';            // Koa framework
import body            from 'koa-body';       // body parser
import compose         from 'koa-compose';    // middleware composer
import compress        from 'koa-compress';   // HTTP compression
import session         from 'koa-session';    // session for flash messages
import Debug           from 'debug';          // small debugging utility
import appApi   from './src/router/app.js';

const debug = Debug('app:req');

const app = new Koa();

app.use(async function responseTime(ctx, next) {
    const t1 = Date.now();
    await next();
    const t2 = Date.now();
    ctx.response.set('X-Response-Time', Math.ceil(t2-t1)+'ms');
});

app.use(compress({}));


// only search-index www subdomain
app.use(async function robots(ctx, next) {
    await next();
    if (ctx.request.hostname.slice(0, 3) != 'www') ctx.response.set('X-Robots-Tag', 'noindex, nofollow');
});

app.use(body({ multipart: true }));


app.keys = [ 'koa-sample-app' ];

app.use(session(app));

app.use(async function(ctx, next) {
    debug(ctx.request.method.padEnd(4) + ' ' + ctx.request.url);
    await next();
});


app.use(async function subApp(ctx, next) {
    ctx.state.subapp = ctx.request.hostname.split('.')[0];

    await next();
});

app.use(async function composeSubapp(ctx) { // note no 'next' after composed subapp
    switch (ctx.state.subapp) {
        case 'api':   await compose(appApi.middleware)(ctx);   break;
        default:
            // note switch must include all registered subdomains to avoid potential redirect loop
            ctx.response.redirect(ctx.request.protocol+'://'+'www.'+ctx.request.host+ctx.path+ctx.search);
            break;
    }
});

app.listen(process.env.PORT||3000);
console.info(`${process.version} listening on port ${process.env.PORT||3000} (${app.env})`);


export default app;
