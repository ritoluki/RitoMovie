import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useCommentReaction } from '@/hooks/useCommentReaction';
import type { Comment, CommentReaction } from '@/services/commentService';

export default function CommentReactions({ comment, userId, compact = false }: { comment: Comment; userId?: string; compact?: boolean }) {
  const { t } = useTranslation();
  const mutation = useCommentReaction(comment._id);
  const locked = useRef(false);
  const liked = !!userId && comment.likes.includes(userId);
  const disliked = !!userId && comment.dislikes.includes(userId);
  const react = (reaction: CommentReaction) => {
    if (!userId || locked.current || mutation.isPending) return;
    locked.current = true;
    mutation.mutate(reaction, { onSettled: () => { locked.current = false; } });
  };
  return <span className="inline-flex items-center gap-2">
    <button type="button" aria-label={t('comments.like')} aria-pressed={liked} aria-busy={mutation.isPending} disabled={!userId || mutation.isPending}
      onClick={() => react(liked ? null : 'like')}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs tabular-nums transition disabled:cursor-not-allowed disabled:opacity-60 ${compact ? 'border-transparent' : 'border-white/[.07]'} ${liked ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'text-gray-400 enabled:hover:bg-white/[.06] enabled:hover:text-white'}`}>
      <ThumbsUp className={`size-3.5 ${liked ? 'fill-current' : ''}`} /><span>{comment.likesCount}</span>
    </button>
    <button type="button" aria-label={t('comments.dislike')} aria-pressed={disliked} aria-busy={mutation.isPending} disabled={!userId || mutation.isPending}
      onClick={() => react(disliked ? null : 'dislike')}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs tabular-nums transition disabled:cursor-not-allowed disabled:opacity-60 ${compact ? 'border-transparent' : 'border-white/[.07]'} ${disliked ? 'border-blue-400/30 bg-blue-400/10 text-blue-300' : 'text-gray-400 enabled:hover:bg-white/[.06] enabled:hover:text-white'}`}>
      <ThumbsDown className={`size-3.5 ${disliked ? 'fill-current' : ''}`} /><span>{comment.dislikesCount}</span>
    </button>
  </span>;
}
