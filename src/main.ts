import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import * as Sentry from '@sentry/node';

const app: Koa = new Koa();
const router: Router = new Router();
const port = process.env.PORT || 3000;

Sentry.init({
  dsn: ''
});

router.get('/ping', async ctx => {
  ctx.body = 'pong';
});

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

app.on('error', (err, ctx) => {
  Sentry.withScope(function (scope) {
    scope.addEventProcessor(function (event) {
      return Sentry.Handlers.parseRequest(event, ctx.request);
    });
    Sentry.captureException(err);
  });
});

app.use(logger());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(json());

app.listen(port, () => {
  console.log(`Koa listening on port: ${port}`);
});

module.exports = app;
