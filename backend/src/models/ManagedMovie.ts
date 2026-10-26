import mongoose, { Schema } from 'mongoose';
import type { MoviePolicy } from '../utils/movieManagement';

export interface IManagedMovie extends MoviePolicy {
  source: 'phimapi' | 'tmdb';
  snapshot: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const translations = { vi: { type: String, default: '' }, en: { type: String, default: '' } };
const overrideSchema = new Schema({
  titles: translations, overviews: translations,
  posterUrl: { type: String, default: '' }, backdropUrl: { type: String, default: '' },
}, { _id: false });

const schema = new Schema<IManagedMovie>({
  source: { type: String, enum: ['phimapi', 'tmdb'], default: 'phimapi', required: true },
  slug: { type: String, required: true, unique: true },
  tmdbId: { type: Number, min: 1 },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  isHidden: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  overrides: { type: overrideSchema, default: () => ({}) },
}, { timestamps: true });
schema.index({ tmdbId: 1, mediaType: 1 });
schema.index({ source: 1, isHidden: 1 });
schema.index({ isHidden: 1, isFeatured: 1, updatedAt: -1 });
schema.index({ isHidden: 1, isTrending: 1, updatedAt: -1 });

export default mongoose.model<IManagedMovie>('ManagedMovie', schema);
