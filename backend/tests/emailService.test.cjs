const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const interval = global.setInterval;
const timerMock = mock.method(global, 'setInterval', (...args) =>
  interval(...args).unref()
);
const settings = require('../dist/services/settingsService').default;
const { sendEmail } = require('../dist/services/emailService');
const { getAllowedOrigins } = require('../dist/utils/corsOrigins');
const {
  smtpOptions,
  smtpErrorMessage,
  verificationLink,
  resetPasswordLink,
} = require('../dist/utils/smtpConfig');
const {
  maskSetting,
  keepSavedSecret,
} = require('../dist/utils/secretSettings');
timerMock.mock.restore();

function configureResend(t) {
  const values = {
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 'fixture-resend-secret',
    EMAIL_FROM: 'noreply@ritomovie.live',
    EMAIL_FROM_NAME: 'RitoMovie',
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]])
  );
  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('deployed frontend origins accept exact URLs and omit the retired VPS', () => {
  const allowed = getAllowedOrigins({
    FRONTEND_URL: 'https://movie.pages.dev/',
    CORS_ORIGINS: ' https://ritomovie.live/, https://www.ritomovie.live ',
  });
  assert.ok(allowed.includes('https://movie.pages.dev'));
  assert.equal(
    allowed.filter((value) => value === 'https://ritomovie.live').length,
    1
  );
  assert.ok(!allowed.includes('https://untrusted.pages.dev'));
  assert.ok(!allowed.some((value) => value.includes('152.42.172.52')));
});

test('Resend production transport uses HTTPS and never reads SMTP credentials', async (t) => {
  configureResend(t);
  t.mock.method(settings, 'getEmailConfig', async () => {
    throw new Error('SMTP must not be used');
  });
  t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer fixture-resend-secret');
    const body = JSON.parse(options.body);
    assert.equal(body.from, 'RitoMovie <noreply@ritomovie.live>');
    assert.deepEqual(body.to, ['receiver@example.test']);
    return new Response(JSON.stringify({ id: 'fixture-id' }), { status: 200 });
  });
  await sendEmail({
    to: 'receiver@example.test',
    subject: 'Test',
    html: 'Test',
  });
});

test('Resend rejects invalid configuration before sending and never exposes provider errors', async (t) => {
  configureResend(t);
  const fetchMock = t.mock.method(
    global,
    'fetch',
    async () => new Response('fixture-resend-secret', { status: 403 })
  );
  const message = {
    to: 'receiver@example.test',
    subject: 'Test',
    html: 'Test',
  };
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendEmail(message), (error) => error.statusCode === 400);
  assert.equal(fetchMock.mock.callCount(), 0);
  process.env.RESEND_API_KEY = 'fixture-resend-secret';
  await assert.rejects(
    sendEmail(message),
    (error) =>
      error.statusCode === 502 &&
      !error.message.includes('fixture-resend-secret')
  );
});

test('Resend quota, network errors and missing acceptance are reported as failures', async (t) => {
  configureResend(t);
  const message = {
    to: 'receiver@example.test',
    subject: 'Test',
    html: 'Test',
  };
  const fetchMock = t.mock.method(
    global,
    'fetch',
    async () => new Response('{}', { status: 429 })
  );
  await assert.rejects(sendEmail(message), (error) => error.statusCode === 429);
  fetchMock.mock.mockImplementation(async () => {
    throw new Error('fixture-resend-secret');
  });
  await assert.rejects(
    sendEmail(message),
    (error) =>
      error.statusCode === 502 &&
      !error.message.includes('fixture-resend-secret')
  );
  fetchMock.mock.mockImplementation(
    async () => new Response('{}', { status: 200 })
  );
  await assert.rejects(sendEmail(message), (error) => error.statusCode === 502);
});

const config = {
  host: 'smtp.resend.com',
  port: 465,
  user: 'resend',
  password: 'fixture-key',
  from: 'noreply@ritomovie.live',
};

test('SMTP validates settings and selects TLS for 465 and STARTTLS for 587', () => {
  assert.equal(smtpOptions(config).secure, true);
  assert.equal(smtpOptions({ ...config, port: 587 }).requireTLS, true);
  assert.equal(smtpOptions({ ...config, port: 587 }).secure, false);
  for (const invalid of [
    { password: '' },
    { host: '' },
    { port: NaN },
    { port: 65536 },
    { from: 'invalid' },
  ]) {
    assert.throws(
      () => smtpOptions({ ...config, ...invalid }),
      (error) => error.statusCode === 400
    );
  }
  assert.equal(
    smtpErrorMessage({ code: 'EAUTH', message: 'fixture-secret' }).includes(
      'fixture-secret'
    ),
    false
  );
});

test('verification and reset links match frontend routes and encode tokens', () => {
  assert.equal(
    verificationLink('https://ritomovie.live/', 'a/b?c'),
    'https://ritomovie.live/verify-email/a%2Fb%3Fc'
  );
  assert.equal(
    resetPasswordLink('http://localhost:5173/', 'a&b'),
    'http://localhost:5173/reset-password?token=a%26b'
  );
});

test('SMTP secrets are masked even in legacy settings and saved masks preserve credentials', () => {
  const masked = maskSetting({
    key: 'smtp_password',
    value: 'fixture-secret',
    isSecret: false,
  });
  assert.equal(masked.value, '********');
  assert.equal(masked.isSecret, true);
  assert.equal(keepSavedSecret(masked), true);
  assert.equal(keepSavedSecret({ key: 'smtp_password', value: '' }), false);
  assert.equal(
    maskSetting({ key: 'smtp_host', value: 'smtp.resend.com' }).value,
    'smtp.resend.com'
  );
});

test('configured sender overrides the legacy sender setting', async (t) => {
  const SystemSetting = require('../dist/models/SystemSetting').default;
  t.mock.method(SystemSetting, 'find', async () => [
    { key: 'smtp_from_email', value: 'noreply@ritomovie.live' },
    { key: 'email_from', value: 'old@example.test' },
  ]);
  await settings.loadSettings();
  assert.equal(
    (await settings.getEmailConfig()).from,
    'noreply@ritomovie.live'
  );
});

test('sendEmail submits the configured sender and recipient to a local SMTP server', async (t) => {
  const commands = [];
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 localhost SMTP fixture\r\n');
    let buffer = '';
    let inData = false;
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            socket.write('250 queued\r\n');
          }
          continue;
        }
        commands.push(line);
        if (/^EHLO/.test(line))
          socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
        else if (/^AUTH/.test(line)) socket.write('235 authenticated\r\n');
        else if (line === 'DATA') {
          inData = true;
          socket.write('354 send data\r\n');
        } else if (line === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
  });
  t.mock.method(settings, 'getEmailConfig', async () => ({
    ...config,
    host: '127.0.0.1',
    port: server.address().port,
  }));
  t.mock.method(settings, 'getSetting', async () => 'RitoMovie');
  await sendEmail({
    to: 'receiver@example.test',
    subject: 'Local SMTP test',
    text: 'Test',
    html: '<p>Test</p>',
  });
  assert.ok(commands.includes('MAIL FROM:<noreply@ritomovie.live>'));
  assert.ok(commands.includes('RCPT TO:<receiver@example.test>'));
});

test('SMTP authentication errors become useful errors without leaking server messages', async (t) => {
  const nodemailer = require('nodemailer');
  t.mock.method(settings, 'getEmailConfig', async () => config);
  t.mock.method(settings, 'getSetting', async () => 'RitoMovie');
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async () => {
      throw Object.assign(new Error('fixture-secret'), { code: 'EAUTH' });
    },
  }));
  await assert.rejects(
    sendEmail({ to: 'receiver@example.test', subject: 'Test', html: 'Test' }),
    (error) => {
      assert.equal(error.statusCode, 502);
      assert.match(error.message, /authentication failed/);
      assert.ok(!error.message.includes('fixture-secret'));
      return true;
    }
  );
});
