// npm run build && node --test tests/adminRealtime.integration.cjs
// Exercises two authenticated clients and real writes in a disposable MongoDB database.
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'admin-realtime-test-only-secret';
const interval = global.setInterval;
mock.method(global, 'setInterval', (...args) => interval(...args).unref());
const User = require('../dist/models/User').default;
const Comment = require('../dist/models/Comment').default;
const Report = require('../dist/models/Report').default;
const { adminChanges } = require('../dist/services/adminEvents');
const {
  closeAdminStreams,
} = require('../dist/controllers/admin/adminEventController');
const reportRoutes = require('../dist/routes/reports').default;
const adminRoutes = require('../dist/routes/admin').default;
const errorHandler = require('../dist/middleware/errorHandler').default;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test(
  'successful writes notify connected admins immediately with role filtering, cleanup and no private payloads',
  { timeout: 40000 },
  async (t) => {
    const dbName = `ritomovie_realtime_test_${process.pid}_${Date.now()}`;
    const subscriptions = [];
    let server;
    t.after(async () => {
      for (const subscription of subscriptions) subscription.abort();
      closeAdminStreams();
      if (server) {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
      }
      if (
        mongoose.connection.name === dbName &&
        /^ritomovie_realtime_test_\d+_\d+$/.test(dbName)
      )
        await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
      mock.restoreAll();
    });
    await mongoose.connect('mongodb://127.0.0.1:27017', {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    await Report.init();
    const makeUser = (name, role = 'user') =>
      User.create({
        name,
        role,
        email: `${name}@example.com`,
        password: 'Test-Only-Password1!',
      });
    const [admin, moderator, analyst, member, author] = await Promise.all([
      makeUser('admin', 'super_admin'),
      makeUser('moderator', 'moderator'),
      makeUser('analyst', 'analyst'),
      makeUser('member'),
      makeUser('author'),
    ]);
    const comment = await Comment.create({
      user: author._id,
      movie: 42,
      text: 'Private report fixture comment',
    });
    const app = express();
    app.use(express.json());
    app.use('/api/reports', reportRoutes);
    app.use('/api/admin', adminRoutes);
    app.use(errorHandler);
    server = await new Promise((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = (path, options = {}, user) =>
      fetch(origin + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(user
            ? { Authorization: `Bearer ${user.getSignedJwtToken()}` }
            : {}),
          ...options.headers,
        },
        signal: options.signal || AbortSignal.timeout(5000),
      });
    assert.equal((await request('/api/admin/events')).status, 401);
    assert.equal(
      (await request('/api/admin/events?token=not-accepted')).status,
      401
    );
    assert.equal((await request('/api/admin/events', {}, member)).status, 403);
    const open = async (user, token = user.getSignedJwtToken()) => {
      const controller = new AbortController();
      subscriptions.push(controller);
      const response = await request('/api/admin/events', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      assert.equal(response.status, 200);
      assert.ok(
        response.headers.get('content-type').includes('text/event-stream')
      );
      assert.ok(response.headers.get('cache-control').includes('no-transform'));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const next = async () => {
        let timer;
        try {
          return await Promise.race([
            (async () => {
              while (true) {
                const end = buffer.indexOf('\n\n');
                if (end >= 0) {
                  const frame = buffer.slice(0, end);
                  buffer = buffer.slice(end + 2);
                  const data = frame
                    .split('\n')
                    .find((line) => line.startsWith('data: '));
                  if (data)
                    return {
                      event: frame
                        .split('\n')
                        .find((line) => line.startsWith('event: '))
                        .slice(7),
                      data: JSON.parse(data.slice(6)),
                    };
                  continue;
                }
                const chunk = await reader.read();
                if (chunk.done) return null;
                buffer += decoder.decode(chunk.value, { stream: true });
              }
            })(),
            new Promise((_, reject) => {
              timer = setTimeout(
                () => reject(new Error('Expected live event did not arrive')),
                3000
              );
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      };
      return { next, abort: () => controller.abort() };
    };
    const first = await open(admin);
    const second = await open(moderator);
    const readOnly = await open(analyst);
    assert.ok((await first.next()).data.topics.includes('users'));
    const moderatorReady = await second.next();
    assert.ok(moderatorReady.data.topics.includes('reports'));
    assert.equal(moderatorReady.data.topics.includes('users'), false);
    assert.deepEqual((await readOnly.next()).data.topics, ['analytics']);
    const sent = await request(
      '/api/reports',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'COMMENT',
          targetId: comment.id,
          reason: 'SPAM',
          description: 'Spam report submitted from an independent client.',
        }),
      },
      member
    );
    assert.equal(sent.status, 201);
    const submitted = await sent.json();
    for (const stream of [first, second]) {
      const event = await stream.next();
      assert.equal(event.event, 'change');
      assert.ok(event.data.topics.includes('reports'));
      assert.deepEqual(Object.keys(event.data), ['topics']);
      assert.equal(JSON.stringify(event).includes(comment.text), false);
      assert.equal(JSON.stringify(event).includes(member.email), false);
    }
    const list = await (await request('/api/admin/reports', {}, admin)).json();
    assert.ok(list.data.some((report) => report._id === submitted.data._id));
    adminChanges.publish(['analytics', 'settings', 'users']);
    assert.deepEqual((await readOnly.next()).data.topics, ['analytics']);
    assert.deepEqual((await second.next()).data.topics, ['analytics']);
    await first.next();

    const observed = [];
    const unsubscribe = adminChanges.subscribe((change) =>
      observed.push(change.topics)
    );
    await assert.rejects(
      Report.create({
        reporter: member._id,
        type: 'MOVIE',
        targetId: 'phim:bad',
        reason: 'OTHER',
        description: 'x'.repeat(1001),
      })
    );
    await Comment.updateMany(
      { _id: new mongoose.Types.ObjectId() },
      { text: 'No matching document' }
    );
    assert.equal(observed.length, 0);
    await Comment.updateOne({ _id: comment._id }, { text: 'Edited comment' });
    assert.ok(observed.at(-1).includes('comments'));
    await User.findByIdAndUpdate(author._id, { name: 'Updated author' });
    assert.ok(observed.at(-1).includes('users'));
    await Comment.deleteMany({ _id: comment._id });
    assert.ok(observed.at(-1).includes('comments'));
    unsubscribe();

    const more = [];
    for (let i = 0; i < 4; i++) {
      const stream = await open(moderator);
      await stream.next();
      more.push(stream);
    }
    const tooMany = await request('/api/admin/events', {}, moderator);
    assert.equal(tooMany.status, 429);
    assert.equal((await tooMany.json()).code, 'REALTIME_CONNECTION_LIMIT');
    for (const stream of more) stream.abort();
    const before = adminChanges.subscriberCount;
    first.abort();
    for (let i = 0; i < 50 && adminChanges.subscriberCount >= before; i++)
      await sleep(10);
    assert.ok(adminChanges.subscriberCount < before);
    const reconnected = await open(admin);
    assert.equal((await reconnected.next()).event, 'ready');
    reconnected.abort();
    second.abort();
    readOnly.abort();
    closeAdminStreams();
    assert.equal(adminChanges.subscriberCount, 0);
  }
);
