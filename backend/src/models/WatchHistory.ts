import mongoose, { Document, Schema } from 'mongoose';
import { adminRealtimePlugin } from '../utils/adminRealtimePlugin';

export interface IWatchHistory extends Document {
  user: mongoose.Types.ObjectId;
  movieId: number;
  progress: number;
  duration: number;
  lastWatched: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WatchHistorySchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    lastWatched: {
      type: Date,
      default: Date.now,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user and movieId
WatchHistorySchema.index({ user: 1, movieId: 1 }, { unique: true });

WatchHistorySchema.plugin(adminRealtimePlugin, { topics: ['users', 'dashboard', 'analytics'] });

export default mongoose.model<IWatchHistory>('WatchHistory', WatchHistorySchema);

