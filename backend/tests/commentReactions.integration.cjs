// Uses only disposable accounts and a fresh local database, never application data.
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
process.env.JWT_SECRET = 'reaction-integration-test-only';
const interval = global.setInterval;
mock.method(global, 'setInterval', (...args) => interval(...args).unref());
const originalError = console.error;
mock.method(console, 'error', (...args) => { if (!args[1]?.isOperational) originalError(...args); });
const User = require('../dist/models/User').default;
const Comment = require('../dist/models/Comment').default;
const Notification = require('../dist/models/Notification').default;

test('reactions are atomic, exclusive, idempotent and never generate reply notifications', { timeout: 60000 }, async t => {
  const dbName = `ritomovie_reactions_test_${process.pid}_${Date.now()}`;
  let server;
  t.after(async () => {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    if (mongoose.connection.name === dbName && /^ritomovie_reactions_test_\d+_\d+$/.test(dbName)) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    mock.restoreAll();
  });
  await mongoose.connect('mongodb://127.0.0.1:27017', { dbName, serverSelectionTimeoutMS: 5000 });
  await Notification.init();
  const users = await Promise.all(Array.from({ length: 5 }, (_, i) => User.create({ name: `Voter ${i}`, email: `voter${i}@example.com`, password: 'Test-Only-Password1!', isEmailVerified: true })));
  const app = express();
  app.use(express.json());
  app.use('/api/comments', require('../dist/routes/comments').default);
  app.use(require('../dist/middleware/errorHandler').default);
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = async (id, reaction, user = users[0], method = 'PUT', suffix = 'reaction') => {
    const response = await fetch(`${origin}/api/comments/${id}/${suffix}`, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.getSignedJwtToken()}` } : {}) }, body: JSON.stringify({ reaction }) });
    return { status: response.status, body: await response.json() };
  };
  const root = await Comment.create({ user: users[0]._id, movie: 42, text: 'Root' });
  // A pre-existing reply has no notification yet. Voting/editing it must not send a new-reply alert.
  const replyId = new mongoose.Types.ObjectId();
  await Comment.collection.insertOne({ _id: replyId, user: users[1]._id, movie: 42, text: 'Legacy reply', parentComment: root._id, likes: [], dislikes: [], isApproved: true, isHidden: false, isDeleted: false });
  for (const reaction of ['like', 'like', 'dislike', null]) {
    const response = await request(replyId, reaction);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.data.reaction, reaction);
    assert.equal(response.body.data.likesCount, reaction === 'like' ? 1 : 0);
    assert.equal(response.body.data.dislikesCount, reaction === 'dislike' ? 1 : 0);
  }
  const legacy = await Comment.findById(replyId);
  legacy.text = 'Edited reply'; await legacy.save();
  assert.equal(await Notification.countDocuments(), 0);
  assert.equal((await request(root.id, 'like', null)).status, 401);
  assert.equal((await request(root.id, 'invalid')).status, 400);
  assert.equal((await request('not-an-id', 'like')).status, 404);
  const concurrent = await Promise.all(users.map(user => request(root.id, 'like', user)));
  concurrent.forEach(response => assert.equal(response.status, 200));
  let stored = await Comment.findById(root.id);
  assert.equal(stored.likes.length, users.length);
  await Promise.all(Array.from({ length: 6 }, () => request(root.id, 'dislike', users[0])));
  stored = await Comment.findById(root.id);
  assert.equal(stored.likes.length, users.length - 1);
  assert.deepEqual(stored.dislikes.map(String), [users[0].id]);
  assert.equal((await request(root.id, null, users[0], 'POST', 'dislike')).body.data.disliked, false);
  assert.equal((await request(root.id, null, users[0], 'POST', 'like')).body.data.liked, true);
  assert.equal((await request(root.id, null, users[0], 'POST', 'like')).body.data.liked, false);
  for (const field of ['isHidden', 'isDeleted', 'isApproved']) {
    await Comment.updateOne({ _id: root._id }, { $set: { [field]: field !== 'isApproved' } });
    assert.equal((await request(root.id, 'like')).status, 404);
    assert.equal((await request(replyId, 'like')).status, 404);
    await Comment.updateOne({ _id: root._id }, { $set: { [field]: field === 'isApproved' } });
  }
  assert.equal(await Notification.countDocuments(), 0);
  const held = await Comment.create({ user: users[1]._id, movie: 42, text: 'Held reply', parentComment: root._id, isApproved: false });
  assert.equal((await request(held.id, 'like')).status, 404);
  held.isApproved = true; await held.save();
  assert.equal(await Notification.countDocuments({ type: 'COMMENT_REPLY' }), 1);
});
