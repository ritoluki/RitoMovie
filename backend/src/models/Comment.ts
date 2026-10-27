import mongoose, { Document, Schema } from 'mongoose';
import { adminRealtimePlugin } from '../utils/adminRealtimePlugin';
import { notifyReply } from '../services/notificationService';

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
    // Moderation fields
    isApproved: boolean;
    isHidden: boolean;
    moderatedBy?: mongoose.Types.ObjectId;
    moderatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    sourcePath?: string;
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
        sourcePath: { type: String, maxlength: 500 },
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
        // Moderation fields
        isApproved: {
            type: Boolean,
            default: true, // Auto-approve by default, change to false for pre-moderation
        },
        isHidden: {
            type: Boolean,
            default: false,
        },
        moderatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        moderatedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
CommentSchema.index({ movie: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

CommentSchema.pre('save', function (next) {
    this.$locals.notifyNewReply = this.isNew || this.isModified('isApproved') || this.isModified('isHidden');
    next();
});
CommentSchema.post('save', async (comment: IComment) => {
    if (comment.$locals.notifyNewReply) await notifyReply(comment);
});
CommentSchema.plugin(adminRealtimePlugin, { topics: ['comments', 'reports', 'dashboard', 'analytics'] });

export default mongoose.model<IComment>('Comment', CommentSchema);
