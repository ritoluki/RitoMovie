import type { Comment, CommentReaction, ReactionResult } from '../services/commentService';
export const isCommentCache = ({ queryKey }: { queryKey: readonly unknown[] }) =>
  ['comments', 'replies', 'comment-thread'].includes(String(queryKey[0]));

export function updateCommentResponse(response: any, id: string, update: (comment: Comment) => Comment): any {
  if (!response?.data) return response;
  const data = response.data;
  if (Array.isArray(data.comments)) {
    if (!data.comments.some((item: Comment) => item._id === id)) return response;
    return { ...response, data: { ...data, comments: data.comments.map((item: Comment) => item._id === id ? update(item) : item) } };
  }
  if (Array.isArray(data)) {
    if (!data.some((item: Comment) => item._id === id)) return response;
    return { ...response, data: data.map((item: Comment) => item._id === id ? update(item) : item) };
  }
  return data._id === id ? { ...response, data: update(data) } : response;
}

export function commentInResponse(response: any, id: string): Comment | undefined {
  const data = response?.data;
  return Array.isArray(data?.comments) ? data.comments.find((item: Comment) => item._id === id)
    : Array.isArray(data) ? data.find((item: Comment) => item._id === id) : data?._id === id ? data : undefined;
}

export function optimisticReaction(comment: Comment, userId: string, reaction: CommentReaction): Comment {
  const liked = comment.likes.includes(userId);
  const disliked = comment.dislikes.includes(userId);
  return { ...comment,
    likes: [...comment.likes.filter(id => id !== userId), ...(reaction === 'like' ? [userId] : [])],
    dislikes: [...comment.dislikes.filter(id => id !== userId), ...(reaction === 'dislike' ? [userId] : [])],
    likesCount: Math.max(0, comment.likesCount + Number(reaction === 'like') - Number(liked)),
    dislikesCount: Math.max(0, comment.dislikesCount + Number(reaction === 'dislike') - Number(disliked)),
  };
}
export function confirmedReaction(comment: Comment, userId: string, result: ReactionResult): Comment {
  return { ...optimisticReaction(comment, userId, result.reaction), likesCount: result.likesCount, dislikesCount: result.dislikesCount };
}
export function restoreReaction(comment: Comment, previous: Comment): Comment {
  return { ...comment, likes: previous.likes, dislikes: previous.dislikes, likesCount: previous.likesCount, dislikesCount: previous.dislikesCount };
}
