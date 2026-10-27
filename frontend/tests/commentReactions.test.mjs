import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optimisticReaction, confirmedReaction, restoreReaction, updateCommentResponse, commentInResponse, isCommentCache } from '../src/lib/commentReactions.ts';

const root = { _id: 'root', text: 'original', likes: ['other'], dislikes: [], likesCount: 1, dislikesCount: 0 };
test('reaction choice is exclusive, repeatable and removable without mutating the cached input', () => {
  const liked = optimisticReaction(root, 'me', 'like');
  assert.equal(liked.likesCount, 2);
  assert.deepEqual(optimisticReaction(liked, 'me', 'like'), liked);
  const disliked = optimisticReaction(liked, 'me', 'dislike');
  assert.deepEqual(disliked.likes, ['other']);
  assert.deepEqual(disliked.dislikes, ['me']);
  assert.equal(disliked.likesCount, 1);
  assert.equal(disliked.dislikesCount, 1);
  assert.deepEqual(optimisticReaction(disliked, 'me', null), root);
  assert.deepEqual(root.likes, ['other']);
});
test('all root, reply and focused-thread caches receive the same reaction and authoritative counts', () => {
  const envelopes = [{ success: true, data: { comments: [root], pagination: { total: 1 } } }, { success: true, data: [root] }, { success: true, data: root }];
  for (const envelope of envelopes) {
    const updated = updateCommentResponse(envelope, 'root', comment => confirmedReaction(comment, 'me', { reaction: 'dislike', likesCount: 5, dislikesCount: 3 }));
    const comment = commentInResponse(updated, 'root');
    assert.equal(comment.likesCount, 5);
    assert.equal(comment.dislikesCount, 3);
    assert.deepEqual(comment.dislikes, ['me']);
    assert.equal(commentInResponse(envelope, 'root'), root);
    assert.equal(updateCommentResponse(envelope, 'missing', () => null), envelope);
  }
  for (const key of ['comments', 'replies', 'comment-thread']) assert.ok(isCommentCache({ queryKey: [key, '42'] }));
  assert.equal(isCommentCache({ queryKey: ['notifications'] }), false);
});
test('failed reaction rolls back only that comment reaction, preserving new text and another target optimistic vote', () => {
  const other = { ...root, _id: 'other-root' };
  let envelope = { data: { comments: [root, other] } };
  envelope = updateCommentResponse(envelope, 'root', comment => optimisticReaction(comment, 'me', 'like'));
  envelope = updateCommentResponse(envelope, 'other-root', comment => optimisticReaction(comment, 'me', 'dislike'));
  envelope = updateCommentResponse(envelope, 'root', comment => ({ ...comment, text: 'updated while waiting' }));
  envelope = updateCommentResponse(envelope, 'root', comment => restoreReaction(comment, root));
  assert.equal(commentInResponse(envelope, 'root').text, 'updated while waiting');
  assert.equal(commentInResponse(envelope, 'root').likesCount, 1);
  assert.equal(commentInResponse(envelope, 'other-root').dislikesCount, 1);
});
