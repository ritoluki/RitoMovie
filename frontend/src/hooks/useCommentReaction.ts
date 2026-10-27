import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { setCommentReaction, type CommentReaction } from '@/services/commentService';
import { isCommentCache, updateCommentResponse, commentInResponse, optimisticReaction, confirmedReaction, restoreReaction } from '@/lib/commentReactions';

export function useCommentReaction(commentId: string) {
  const client = useQueryClient();
  const userId = useAuthStore(state => state.user?._id);
  const { t } = useTranslation();
  return useMutation({
    mutationKey: ['comment-reaction', commentId],
    mutationFn: (reaction: CommentReaction) => setCommentReaction(commentId, reaction),
    onMutate: async reaction => {
      await client.cancelQueries({ predicate: isCommentCache });
      const snapshots = client.getQueriesData({ predicate: isCommentCache }).map(([key, data]) => ({ key, previous: commentInResponse(data, commentId) }));
      client.setQueriesData({ predicate: isCommentCache }, current => updateCommentResponse(current, commentId, comment => optimisticReaction(comment, userId!, reaction)));
      return { snapshots };
    },
    onSuccess: response => {
      client.setQueriesData({ predicate: isCommentCache }, current => updateCommentResponse(current, commentId, comment => confirmedReaction(comment, userId!, response.data)));
    },
    onError: (error: { code?: string }, _reaction, context) => {
      for (const snapshot of context?.snapshots || []) {
        if (snapshot.previous) client.setQueryData(snapshot.key, current => updateCommentResponse(current, commentId, comment => restoreReaction(comment, snapshot.previous!)));
      }
      if (error?.code === 'EMAIL_VERIFICATION_REQUIRED') return;
      toast.error(t(error?.code === 'COMMENT_NOT_AVAILABLE' ? 'notifications.commentUnavailable' : 'comments.reactionFailed'));
    },
    onSettled: () => {
      // Do not overwrite another comment's in-flight optimistic choice with a list refresh.
      if (client.isMutating({ mutationKey: ['comment-reaction'] }) === 1) return client.invalidateQueries({ predicate: isCommentCache, refetchType: 'active' });
    },
  });
}
