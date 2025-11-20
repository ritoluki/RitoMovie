import mongoose, { Document, Schema } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  videoUrl: string;
  duration: number;
  quality: string[];
  tmdbId?: number;
  genres: string[];
  releaseDate: Date;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    poster: {
      type: String,
      required: [true, 'Please add a poster image'],
    },
    backdrop: {
      type: String,
      required: [true, 'Please add a backdrop image'],
    },
    videoUrl: {
      type: String,
      required: [true, 'Please add a video URL'],
    },
    duration: {
      type: Number,
      required: [true, 'Please add duration in minutes'],
      min: 0,
    },
    quality: [
      {
        type: String,
        enum: ['360p', '480p', '720p', '1080p', '4K'],
      },
    ],
    tmdbId: {
      type: Number,
    },
    genres: [
      {
        type: String,
      },
    ],
    releaseDate: {
      type: Date,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search
MovieSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IMovie>('Movie', MovieSchema);

