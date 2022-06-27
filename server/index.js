const Koa = require('koa');
// const Router = require('@koa/router')
const serve = require('koa-static');
const app = new Koa();
// const router = new Router();
const PORT = process.env.PORT || 3888;

// router.redirect("*","/");
const redirect = async function (ctx, next) {
    if (ctx.request.url === '/quant/grid') {
        ctx.redirect('/');
    }
    await next();
}
app.use(redirect);
app.use(serve(__dirname + "/public", { extensions: ["html"] }))


app.listen(PORT, function () {
    console.log('koa server running at port', PORT);
})