import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
    user: mongoose.Types.ObjectId;
    movie: number; // TMDB movie ID
    text: string;
    rating?: number;
    likes: mongoose.Types.ObjectId[];
    dislikes: mongoose.Types.ObjectId[];
    isSpoiler: boolean;
    parentComment?: mongoose.Types.ObjectId; // For replies
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
        },
        movie: {
            type: Number,
            required: [true, 'Movie ID is required'],
            index: true,
        },
        text: {
            type: String,
            required: [true, 'Comment text is required'],
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        rating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [10, 'Rating cannot exceed 10'],
            default: null,
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        dislikes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isSpoiler: {
            type: Boolean,
            default: false,
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
CommentSchema.index({ movie: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
