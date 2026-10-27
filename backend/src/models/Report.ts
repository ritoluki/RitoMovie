import mongoose, { Document, Schema } from 'mongoose';
import { adminRealtimePlugin } from '../utils/adminRealtimePlugin';
import { ReportContext, ReportReason, REPORT_REASONS } from '../utils/reportPolicy';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  type: 'COMMENT' | 'USER' | 'MOVIE' | 'BUG';
  targetId: mongoose.Types.ObjectId | string; // ObjectId for COMMENT/USER/MOVIE, string for BUG
  targetModel?: 'Comment' | 'User' | 'Movie'; // Helps with dynamic reference population
  reason: ReportReason;
  context?: ReportContext;
  description: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reviewedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['COMMENT', 'USER', 'MOVIE', 'BUG'],
    },
    targetId: {
      type: Schema.Types.Mixed,
      required: true,
    },
    targetModel: {
      type: String,
      enum: ['Comment', 'User', 'Movie'],
    },
    reason: {
      type: String,
      required: true,
      enum: [...new Set(Object.values(REPORT_REASONS).flat())],
    },
    context: {
      type: new Schema({
        movieId: Number,
        mediaType: { type: String, enum: ['movie', 'tv'] },
        movieSlug: String,
        movieTitle: String,
        episode: String,
        server: String,
        pagePath: String,
        commentId: String,
        commentText: String,
        authorName: String,
      }, { _id: false }),
      default: undefined,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for report management
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ type: 1, status: 1 });
ReportSchema.index({ priority: 1, status: 1 });
ReportSchema.index({ reporter: 1, createdAt: -1 });
ReportSchema.index({ reviewedBy: 1, status: 1 });
// Concurrent submissions cannot create duplicate open reports for the same person and target.
ReportSchema.index({ reporter: 1, type: 1, targetId: 1 }, {
  unique: true,
  partialFilterExpression: { status: { $in: ['PENDING', 'REVIEWING'] } },
});

// Validation middleware to ensure targetModel matches type
ReportSchema.pre('save', function (next) {
  if (this.type === 'BUG') {
    this.targetModel = undefined;
  } else {
    this.targetModel =
      this.type === 'COMMENT' ? 'Comment' : this.type === 'USER' ? 'User' : 'Movie';
  }
  next();
});

// Virtual populate for target
ReportSchema.virtual('target', {
  refPath: 'targetModel',
  localField: 'targetId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON output
ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });

ReportSchema.plugin(adminRealtimePlugin, { topics: ['reports', 'dashboard'] });

export default mongoose.model<IReport>('Report', ReportSchema);
