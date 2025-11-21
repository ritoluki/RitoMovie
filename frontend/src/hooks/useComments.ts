import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getMovieComments,
    getCommentReplies,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    CreateCommentData,
    UpdateCommentData,
} from '../services/commentService';
import toast from 'react-hot-toast';

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
    });
};

// Get replies for a comment
export const useCommentReplies = (commentId: string | null) => {
    return useQuery({
        queryKey: ['replies', commentId],
        queryFn: () => getCommentReplies(commentId!),
        enabled: !!commentId,
    });
};

// Create comment mutation
export const useCreateComment = (movieId?: number) => {
    const queryClient = useQueryClient();

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
            const message = error.response?.data?.message || 'Không thể đăng bình luận';
            toast.error(message);
        },
    });
};

// Update comment mutation
export const useUpdateComment = () => {
    const queryClient = useQueryClient();

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

// Like comment mutation
export const useLikeComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => likeComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['comments'],
                refetchType: 'all'
            });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Không thể thích bình luận';
            toast.error(message);
        },
    });
};

// Dislike comment mutation
export const useDislikeComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => dislikeComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['comments'],
                refetchType: 'all'
            });
        },
        onError: (error: any) => {
            const message =
                error.response?.data?.message || 'Không thể dislike bình luận';
            toast.error(message);
        },
    });
};
