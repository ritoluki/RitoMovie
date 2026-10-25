import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  beginApiRequest,
  hasSlowApiRequests,
  subscribeToApiActivity,
} from '../src/lib/apiActivity.ts';

test('a slow request stays visible until all slow concurrent requests finish', async () => {
  const changes = [];
  const unsubscribe = subscribeToApiActivity(() =>
    changes.push(hasSlowApiRequests())
  );
  const first = beginApiRequest(5);
  const second = beginApiRequest(5);
  assert.equal(hasSlowApiRequests(), false);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(hasSlowApiRequests(), true);
  first();
  assert.equal(hasSlowApiRequests(), true);
  second();
  assert.equal(hasSlowApiRequests(), false);
  assert.ok(changes.includes(true));
  unsubscribe();
});

test('fast or cancelled requests never display a slow status', async () => {
  const finish = beginApiRequest(5);
  finish();
  finish();
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(hasSlowApiRequests(), false);
});
