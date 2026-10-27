// Run after npm run build: node --test tests/reports.integration.cjs
// Uses a disposable local database; never reads or changes application accounts.
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
process.env.JWT_SECRET = 'report-integration-test-only-secret';
const originalInterval = global.setInterval;
mock.method(global, 'setInterval', (...args) =>
  originalInterval(...args).unref()
);
const originalError = console.error;
mock.method(console, 'error', (...args) => {
  if (!args[1]?.isOperational) originalError(...args);
});
const Report = require('../dist/models/Report').default;
const User = require('../dist/models/User').default;
const Comment = require('../dist/models/Comment').default;
const AuditLog = require('../dist/models/AuditLog').default;
const reportRoutes = require('../dist/routes/reports').default;
const adminRoutes = require('../dist/routes/admin').default;
const errorHandler = require('../dist/middleware/errorHandler').default;

test(
  'reports connect authenticated submission, abuse limits and moderation without treating external movie IDs as ObjectIds',
  { timeout: 60000 },
  async (t) => {
    const dbName = `ritomovie_reports_test_${process.pid}_${Date.now()}`;
    let server;
    t.after(async () => {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (
        mongoose.connection.name === dbName &&
        /^ritomovie_reports_test_\d+_\d+$/.test(dbName)
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
    const app = express();
    app.use(express.json());
    app.use('/api/reports', reportRoutes);
    app.use('/api/comments', require('../dist/routes/comments').default);
    app.use('/api/admin', adminRoutes);
    app.use(errorHandler);
    server = await new Promise((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const makeUser = (name, role = 'user') =>
      User.create({
        name,
        email: `${name}@example.com`,
        password: 'Test-Only-Password1!',
        role,
      });
    const [author, member, moderator, other, daily] = await Promise.all([
      makeUser('author'),
      makeUser('member'),
      makeUser('moderator', 'moderator'),
      makeUser('other'),
      makeUser('daily'),
    ]);
    const request = async (path, { method = 'GET', body, user } = {}) => {
      const response = await fetch(origin + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(user
            ? { Authorization: `Bearer ${user.getSignedJwtToken()}` }
            : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    };
    const submit = (body, user = member) =>
      request('/api/reports', { method: 'POST', body, user });
    const admin = (path, body, method = 'POST') =>
      request('/api/admin/reports' + path, { user: moderator, method, body });
    const payload = {
      type: 'MOVIE',
      targetId: 'phim:report-demo',
      reason: 'PLAYBACK_ERROR',
      description: 'The player stays black after selecting episode two.',
      context: {
        movieTitle: 'Report demo',
        episode: '2',
        server: 'Vietsub',
        pagePath: '/watch/report-demo?episode=2',
      },
    };
    const comment = await Comment.create({
      user: author._id,
      movie: 42,
      text: 'Original comment for report testing',
    });
    const reportComment = {
      type: 'COMMENT',
      targetId: comment.id,
      reason: 'SPOILER',
      description: 'This comment reveals the ending without a spoiler warning.',
      status: 'RESOLVED',
      priority: 'CRITICAL',
      reporter: moderator.id,
      context: { commentText: 'forged snapshot', movieId: 999 },
    };
    assert.equal(
      (await request('/api/reports', { method: 'POST', body: payload })).status,
      401
    );
    assert.equal(
      (await submit({ ...payload, description: 'short' })).status,
      400
    );
    assert.equal(
      (await submit({ ...payload, reason: 'HARASSMENT' })).status,
      400
    );
    assert.equal(
      (await submit({ ...payload, targetId: { $ne: null } })).status,
      400
    );
    assert.equal((await submit(reportComment, author)).status, 400);
    assert.equal(
      (
        await submit({
          ...reportComment,
          targetId: new mongoose.Types.ObjectId().toString(),
        })
      ).status,
      404
    );
    const created = await submit(reportComment);
    assert.equal(created.status, 201);
    const id = created.body.data._id;
    const saved = await Report.findById(id);
    assert.equal(saved.reporter.toString(), member.id);
    assert.equal(saved.status, 'PENDING');
    assert.equal(saved.priority, 'MEDIUM');
    assert.equal(saved.context.commentText, comment.text);
    assert.equal(saved.context.movieId, 42);
    await assert.rejects(
      Report.create({
        reporter: member._id,
        type: 'COMMENT',
        targetId: comment.id,
        reason: 'SPAM',
        description: 'Concurrent duplicate insert',
      }),
      (error) => error.code === 11000
    );
    assert.equal((await submit(reportComment)).body.code, 'REPORT_DUPLICATE');
    assert.equal((await submit(payload)).body.code, 'REPORT_RATE_LIMITED');
    assert.equal(
      (await request('/api/admin/reports', { user: member })).status,
      403
    );
    const details = await admin(`/${id}`, undefined, 'GET');
    assert.equal(details.status, 200);
    assert.equal(details.body.data.target.text, comment.text);
    assert.equal(
      (await admin(`/${id}/status`, { status: 'REVIEWING' }, 'PUT')).status,
      200
    );
    assert.equal(
      (await admin(`/${id}/priority`, { priority: 'HIGH' }, 'PUT')).status,
      200
    );
    assert.equal(
      (
        await admin(`/${id}/resolve`, {
          resolution: 'x',
          action: 'HIDE_COMMENT',
        })
      ).status,
      400
    );
    assert.equal(
      (
        await admin(`/${id}/resolve`, {
          resolution: 'Confirmed spoiler and hid the comment.',
          action: 'HIDE_COMMENT',
        })
      ).status,
      200
    );
    assert.equal((await Comment.findById(comment.id)).isHidden, true);
    assert.equal(
      (await request('/api/comments/movie/42')).body.data.comments.length,
      0
    );
    assert.equal(
      (
        await admin(`/${id}/reject`, {
          reason: 'Do not overwrite closed decisions.',
        })
      ).status,
      409
    );
    assert.ok(await AuditLog.exists({ resource: 'REPORT', resourceId: id }));
    assert.ok(
      await AuditLog.exists({ resource: 'COMMENT', resourceId: comment.id })
    );

    await Report.collection.updateOne(
      { _id: saved._id },
      { $set: { createdAt: new Date(Date.now() - 61_000) } }
    );
    const simultaneous = await Promise.all([submit(payload), submit(payload)]);
    assert.equal(
      simultaneous.filter((result) => result.status === 201).length,
      1
    );
    assert.ok(
      simultaneous.some(
        (result) => result.status === 409 || result.status === 429
      )
    );
    const movieId = simultaneous.find((result) => result.status === 201).body
      .data._id;
    const movieDetails = await admin(`/${movieId}`, undefined, 'GET');
    assert.equal(movieDetails.status, 200);
    assert.equal(movieDetails.body.data.target, null);
    assert.equal(movieDetails.body.data.report.context.episode, '2');
    assert.equal(
      (
        await admin(`/${movieId}/resolve`, {
          resolution: 'Checked video.',
          action: 'HIDE_COMMENT',
        })
      ).status,
      400
    );
    assert.equal(
      (
        await admin('/bulk-action', {
          action: 'resolve',
          reportIds: [id, movieId],
          reason: 'Checked source playback and fixed the episode.',
        })
      ).body.modifiedCount,
      1
    );
    assert.equal(
      (await Report.findById(id)).resolution,
      'Confirmed spoiler and hid the comment.'
    );
    assert.equal(
      (
        await admin('/bulk-action', {
          action: 'reject',
          reportIds: [movieId],
          reason: '',
        })
      ).status,
      400
    );
    assert.equal(
      (
        await admin('/bulk-action', {
          action: 'reject',
          reportIds: ['invalid'],
          reason: 'Invalid identifier',
        })
      ).status,
      400
    );

    const another = await Comment.create({
      user: author._id,
      movie: 42,
      text: 'Snapshot survives removal',
    });
    const snapshot = await submit(
      { ...reportComment, targetId: another.id },
      other
    );
    await Comment.deleteOne({ _id: another._id });
    const removed = await admin(`/${snapshot.body.data._id}`, undefined, 'GET');
    assert.equal(removed.body.data.target, null);
    assert.equal(removed.body.data.report.context.commentText, another.text);
    assert.equal(
      (
        await admin(`/${snapshot.body.data._id}/resolve`, {
          resolution: 'Original content is already removed.',
        })
      ).status,
      200
    );
    await Report.insertMany(
      Array.from({ length: 10 }, (_, index) => ({
        reporter: daily._id,
        type: 'MOVIE',
        targetId: `phim:daily-${index}`,
        reason: 'OTHER',
        description: 'Daily limit test data',
        status: 'RESOLVED',
        createdAt: new Date(Date.now() - 120_000),
      }))
    );
    assert.equal(
      (await submit(payload, daily)).body.code,
      'REPORT_DAILY_LIMIT'
    );
    const userReporter = await makeUser('userreporter');
    const userReport = await submit(
      {
        type: 'USER',
        targetId: author.id,
        reason: 'HARASSMENT',
        description: 'Repeated harassment by the same author.',
        context: { commentId: comment.id, authorName: 'Forged name' },
      },
      userReporter
    );
    assert.equal(userReport.status, 201);
    assert.equal(
      (await Report.findById(userReport.body.data._id)).context.authorName,
      author.name
    );
    assert.equal(
      (
        await submit(
          {
            type: 'USER',
            targetId: userReporter.id,
            reason: 'OTHER',
            description: 'Trying to report myself.',
          },
          userReporter
        )
      ).body.code,
      'REPORT_SELF'
    );
    const filtered = await request(
      '/api/admin/reports?status=RESOLVED&type=MOVIE',
      { user: moderator }
    );
    assert.equal(filtered.status, 200);
    assert.ok(
      filtered.body.data.every(
        (report) => report.status === 'RESOLVED' && report.type === 'MOVIE'
      )
    );
  }
);
