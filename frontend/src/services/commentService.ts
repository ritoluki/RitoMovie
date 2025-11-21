import axios from '../lib/axios';

export interface Comment {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    movie: number;
    text: string;
    rating?: number;
    likes: string[];
    dislikes: string[];
    isSpoiler: boolean;
    parentComment?: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    dislikesCount: number;
    repliesCount?: number;
}

export interface CreateCommentData {
    movie: number;
    text: string;
    rating?: number;
    isSpoiler?: boolean;
    parentComment?: string;
}

export interface UpdateCommentData {
    text?: string;
    rating?: number;
    isSpoiler?: boolean;
}

export interface CommentsResponse {
    success: boolean;
    data: {
        comments: Comment[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface CommentResponse {
    success: boolean;
    data: Comment;
}

export interface LikeResponse {
    success: boolean;
    data: {
        liked: boolean;
        likesCount: number;
        dislikesCount: number;
    };
}

export interface DislikeResponse {
    success: boolean;
    data: {
        disliked: boolean;
        likesCount: number;
        dislikesCount: number;
    };
}

// Get comments for a movie
export const getMovieComments = async (
    movieId: number,
    page = 1,
    limit = 10,
    sort: 'recent' | 'popular' | 'oldest' = 'recent'
): Promise<CommentsResponse> => {
    const response = await axios.get(`/comments/movie/${movieId}`, {
        params: { page, limit, sort },
    });
    return response as unknown as CommentsResponse;
};

// Get replies for a comment
export const getCommentReplies = async (
    commentId: string
): Promise<{ success: boolean; data: Comment[] }> => {
    const response = await axios.get(`/comments/${commentId}/replies`);
    return response as unknown as { success: boolean; data: Comment[] };
};

// Create a new comment
export const createComment = async (
    data: CreateCommentData
): Promise<CommentResponse> => {
    const response = await axios.post('/comments', data);
    return response as unknown as CommentResponse;
};

// Update a comment
export const updateComment = async (
    commentId: string,
    data: UpdateCommentData
): Promise<CommentResponse> => {
    const response = await axios.put(`/comments/${commentId}`, data);
    return response as unknown as CommentResponse;
};

// Delete a comment
export const deleteComment = async (
    commentId: string
): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`/comments/${commentId}`);
    return response as unknown as { success: boolean; message: string };
};

// Like a comment
export const likeComment = async (commentId: string): Promise<LikeResponse> => {
    const response = await axios.post(`/comments/${commentId}/like`);
    return response as unknown as LikeResponse;
};

// Dislike a comment
export const dislikeComment = async (
    commentId: string
): Promise<DislikeResponse> => {
    const response = await axios.post(`/comments/${commentId}/dislike`);
    return response as unknown as DislikeResponse;
};
