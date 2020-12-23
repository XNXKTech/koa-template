import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import * as Sentry from '@sentry/node';
import {
  extractTraceparentData,
  stripUrlQueryAndFragment
} from '@sentry/tracing';
import * as domain from 'domain';

const app: Koa = new Koa();
const router: Router = new Router();
const port = process.env.PORT || 3000;

Sentry.init({
  tracesSampleRate: 1.0
});

const requestHandler = (ctx, next) => {
  return new Promise<void>((resolve, _) => {
    const local = domain.create();
    local.add(ctx);
    local.on('error', err => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.app.emit('error', err, ctx);
    });
    local.run(async () => {
      Sentry.getCurrentHub().configureScope(scope =>
        scope.addEventProcessor(event =>
          Sentry.Handlers.parseRequest(event, ctx.request, {user: false})
        )
      );
      await next();
      resolve();
    });
  });
};

// this tracing middleware creates a transaction per request
const tracingMiddleWare = async (ctx, next) => {
  const reqMethod = (ctx.method || '').toUpperCase();
  const reqUrl = ctx.url && stripUrlQueryAndFragment(ctx.url);

  // connect to trace of upstream app
  let traceparentData;
  if (ctx.request.get('sentry-trace')) {
    traceparentData = extractTraceparentData(ctx.request.get('sentry-trace'));
  }

  const transaction = Sentry.startTransaction({
    name: `${reqMethod} ${reqUrl}`,
    op: 'http.server',
    ...traceparentData
  });

  ctx.__sentry_transaction = transaction;
  await next();

  // if using koa router, a nicer way to capture transaction using the matched route
  if (ctx._matchedRoute) {
    const mountPath = ctx.mountPath || '';
    transaction.setName(`${reqMethod} ${mountPath}${ctx._matchedRoute}`);
  }
  transaction.setHttpStatus(ctx.status);
  transaction.finish();
};

app.use(requestHandler);
app.use(tracingMiddleWare);

app.on('error', (err, ctx) => {
  Sentry.withScope(function (scope) {
    scope.addEventProcessor(function (event) {
      return Sentry.Handlers.parseRequest(event, ctx.request);
    });
    Sentry.captureException(err);
  });
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

app.use(logger());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(json());

app.listen(port, () => {
  console.log(`Koa listening on port: ${port}`);
});

module.exports = app;
