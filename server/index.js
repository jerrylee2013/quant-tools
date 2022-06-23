const Koa = require('koa');
const serve = require('koa-static');
const app = new Koa();
const PORT = process.env.PORT || 3888;

app.use(serve(__dirname + "/public", {extensions: ["html"]}))
app.listen(PORT, function() {
    console.log('koa server running at port', PORT);
})