const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');
const { addExternalApiRetries, describeExternalApiError } = require('../dist/utils/externalApi');

async function withServer(handler, run) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const client = axios.create({
    baseURL: `http://127.0.0.1:${server.address().port}`,
    timeout: 1000,
    proxy: false,
  });
  addExternalApiRetries(client, 'TestAPI');
  try {
    await run(client);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('GET recovers from a reset connection and preserves its query', async () => {
  let attempts = 0;
  await withServer((req, res) => {
    attempts++;
    assert.equal(req.url, '/movies?language=vi');
    if (attempts === 1) return req.socket.destroy();
    res.end('recovered');
  }, async client => {
    const response = await client.get('/movies', { params: { language: 'vi' } });
    assert.equal(response.data, 'recovered');
    assert.equal(attempts, 2);
  });
});

test('GET stops after two retries on persistent resets', async () => {
  let attempts = 0;
  await withServer((req) => {
    attempts++;
    req.socket.destroy();
  }, async client => {
    await assert.rejects(client.get('/movies'), { code: 'ECONNRESET' });
    assert.equal(attempts, 3);
  });
});

test('GET retries temporary HTTP 503 responses', async () => {
  let attempts = 0;
  await withServer((_req, res) => {
    attempts++;
    res.statusCode = attempts === 1 ? 503 : 200;
    res.end('result');
  }, async client => {
    assert.equal((await client.get('/movies')).status, 200);
    assert.equal(attempts, 2);
  });
});

test('authentication errors are not retried', async () => {
  let attempts = 0;
  await withServer((_req, res) => {
    attempts++;
    res.statusCode = 401;
    res.end();
  }, async client => {
    await assert.rejects(client.get('/movies'), error => error.response.status === 401);
    assert.equal(attempts, 1);
  });
});

test('POST requests are not retried', async () => {
  let attempts = 0;
  await withServer(req => {
    attempts++;
    req.socket.destroy();
  }, async client => {
    await assert.rejects(client.post('/movies'), { code: 'ECONNRESET' });
    assert.equal(attempts, 1);
  });
});

test('error descriptions omit credentials and query parameters', () => {
  const error = new axios.AxiosError('reset', 'ECONNRESET', {
    baseURL: 'https://user:password@api.example.com',
    url: '/movies?api_key=secret',
    params: { api_key: 'another-secret' },
  });
  assert.equal(describeExternalApiError(error), 'api.example.com/movies: ECONNRESET');
});
