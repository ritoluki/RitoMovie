import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getMovieComments,
    getCommentReplies,
    createComment,
    updateComment,
    deleteComment,
    CreateCommentData,
    UpdateCommentData,
} from '../services/commentService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Get comments for a movie
export const useMovieComments = (
    movieId: number,
    page = 1,
    limit = 10,
    sort: 'recent' | 'popular' | 'oldest' = 'recent'
) => {
    return useQuery({
        queryKey: ['comments', movieId, page, sort],
        queryFn: () => getMovieComments(movieId, page, limit, sort),
        staleTime: 1000 * 60, // 1 minute
        refetchOnMount: true,
    });
};

// Get replies for a comment
export const useCommentReplies = (commentId: string | null) => {
    return useQuery({
        queryKey: ['replies', commentId],
        queryFn: () => getCommentReplies(commentId!),
        enabled: !!commentId,
        staleTime: 0,
        refetchOnMount: true,
    });
};

// Create comment mutation
export const useCreateComment = (movieId?: number) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (data: CreateCommentData) => createComment(data),
        onSuccess: (response, variables) => {
            // Invalidate ALL comments queries for this movie
            queryClient.invalidateQueries({
                queryKey: ['comments', variables.movie],
                refetchType: 'all'
            });

            // Optionally refetch immediately if movieId is provided
            if (movieId) {
                queryClient.refetchQueries({
                    queryKey: ['comments', movieId],
                    type: 'all'
                });
            }

            // If it's a reply, also invalidate replies query
            if (variables.parentComment) {
                queryClient.invalidateQueries({
                    queryKey: ['replies', variables.parentComment],
                });
            }

            toast.success('Bình luận đã được đăng!');
        },
        onError: (error: any) => {
            if (error?.code === 'EMAIL_VERIFICATION_REQUIRED') return;
            if (error?.code === 'COMMENTING_RESTRICTED') {
                const { reason, expiresAt } = error.response?.data || {};
                const until = expiresAt ? new Date(expiresAt).toLocaleString() : undefined;
                const message = [
                    t('comments.restricted'),
                    reason ? t('comments.restrictionReason', { reason }) : '',
                    until ? t('comments.restrictionUntil', { until }) : '',
                ].filter(Boolean).join(' ');
                toast.error(message);
                return;
            }
            const message = error.response?.data?.message || 'Không thể đăng bình luận';
            toast.error(message);
        },
    });
};

// Update comment mutation
export const useUpdateComment = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: ({
            commentId,
            data,
        }: {
            commentId: string;
            data: UpdateCommentData;
        }) => updateComment(commentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['comments'],
                refetchType: 'all'
            });
            toast.success('Bình luận đã được cập nhật!');
        },
        onError: (error: any) => {
            if (error?.code === 'EMAIL_VERIFICATION_REQUIRED') return;
            if (error?.code === 'COMMENTING_RESTRICTED') {
                const { reason, expiresAt } = error.response?.data || {};
                const until = expiresAt ? new Date(expiresAt).toLocaleString() : undefined;
                const message = [
                    t('comments.restricted'),
                    reason ? t('comments.restrictionReason', { reason }) : '',
                    until ? t('comments.restrictionUntil', { until }) : '',
                ].filter(Boolean).join(' ');
                toast.error(message);
                return;
            }
            const message =
                error.response?.data?.message || 'Không thể cập nhật bình luận';
            toast.error(message);
        },
    });
};

// Delete comment mutation
export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['comments'],
                refetchType: 'all'
            });
            toast.success('Bình luận đã được xóa!');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể xóa bình luận';
            toast.error(message);
        },
    });
};
