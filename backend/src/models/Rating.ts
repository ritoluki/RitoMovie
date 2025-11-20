import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  user: mongoose.Types.ObjectId;
  movieId: number;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema = new Schema(
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
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    review: {
      type: String,
      maxlength: [500, 'Review cannot be more than 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user and movieId
RatingSchema.index({ user: 1, movieId: 1 }, { unique: true });

export default mongoose.model<IRating>('Rating', RatingSchema);

