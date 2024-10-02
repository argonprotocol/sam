import runStart from './endpoints/runStart';
import runCollapse from './endpoints/runCollapse';
import runRecovery from './endpoints/runRecovery';
import runDollar from './endpoints/runDollar';

const CORS_HEADERS = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
};

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('Departed', CORS_HEADERS);
    }

    if (path === '/') {
      return Response.json({ hello: 'world' }, CORS_HEADERS);
    }

    if (path === '/run/start') {
      const data = await runStart(req);
      return Response.json(data, CORS_HEADERS);
    }

    if (path === '/run/collapse') {
      const data = await runCollapse(req);
      return Response.json(data, CORS_HEADERS);
    }

    if (path === '/run/recovery') {
      const data = await runRecovery(req);
      return Response.json(data, CORS_HEADERS);
    }

    if (path === '/run/dollar') {
      const data = await runDollar(req);
      return Response.json(data, CORS_HEADERS);
    }

    // Default response for undefined paths
    return new Response('Not Found', { status: 404, ...CORS_HEADERS });
  }
});

console.log(`Listening on ${server.url}`);