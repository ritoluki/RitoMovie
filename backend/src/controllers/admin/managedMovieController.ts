import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ManagedMovie from '../../models/ManagedMovie';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import { asRecord, unwrapPhimData } from '../../utils/phimPayload';
import { bulkMovieActions, escapeSearch, parseMoviePatch, validateSlug, movieIsHidden, MoviePolicy } from '../../utils/movieManagement';
import { getMovieBySlug, getHomeUpdates, searchMovies } from '../../services/phimApiService';
import { logAdminAction } from '../../middleware/adminAuth';

const idFrom = (value: string) => {
  if (!mongoose.isObjectIdOrHexString(value)) throw new ApiError(400, 'Invalid managed movie ID');
  return value;
};
const pageFrom = (value: unknown) => {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
};
const view = (doc: any) => ({
  ...doc, _id: String(doc._id), title: doc.overrides?.titles?.vi || doc.snapshot.name,
  original_title: doc.snapshot.origin_name, poster_path: doc.overrides?.posterUrl || doc.snapshot.thumb_url || doc.snapshot.poster_url,
  release_date: doc.snapshot.year ? `${doc.snapshot.year}-01-01` : '',
  genres: (doc.snapshot.category || []).map((genre: any) => genre.name),
  vote_average: doc.snapshot.tmdb?.vote_average, tmdb_id: doc.tmdbId,
});

const relatedPolicies = (docs: any[]) => ManagedMovie.find({ $or: [
  { _id: { $in: docs.map(doc => doc._id) } },
  { tmdbId: { $in: docs.map(doc => doc.tmdbId).filter(Boolean) } },
] }).select('source slug tmdbId mediaType isHidden isFeatured isTrending').lean() as unknown as Promise<MoviePolicy[]>;
const viewWithVisibility = async (doc: any) => ({ ...view(doc), effectiveHidden: movieIsHidden(doc.snapshot, await relatedPolicies([doc]), doc.mediaType) });

export const listMovies = asyncHandler(async (req: Request, res: Response) => {
  const page = pageFrom(req.query.page);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit) || 20)));
  const query: Record<string, unknown> = {};
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const term = escapeSearch(req.query.search.trim().slice(0, 200));
    query.$or = ['slug', 'snapshot.name', 'snapshot.origin_name', 'overrides.titles.vi', 'overrides.titles.en']
      .map(field => ({ [field]: { $regex: term, $options: 'i' } }));
  }
  if (req.query.genre) query['snapshot.category.name'] = String(req.query.genre);
  if (req.query.status === 'hidden') query.isHidden = true;
  if (req.query.status === 'visible') query.isHidden = false;
  if (req.query.status === 'featured') query.isFeatured = true;
  if (req.query.status === 'trending') query.isTrending = true;
  const sortKeys: Record<string, string> = { title: 'snapshot.name', createdAt: 'createdAt', updatedAt: 'updatedAt', release_date: 'snapshot.year' };
  const requestedSort = String(req.query.sortBy);
  const sortKey = Object.prototype.hasOwnProperty.call(sortKeys, requestedSort) ? sortKeys[requestedSort] : 'updatedAt';
  const [movies, total] = await Promise.all([
    ManagedMovie.find(query).sort({ [sortKey]: req.query.sortOrder === 'asc' ? 1 : -1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    ManagedMovie.countDocuments(query),
  ]);
  const policies = movies.length ? await relatedPolicies(movies) : [];
  res.json({ success: true, data: movies.map(doc => ({ ...view(doc), effectiveHidden: movieIsHidden(doc.snapshot, policies, doc.mediaType) })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const sourceMovies = asyncHandler(async (req: Request, res: Response) => {
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim().slice(0, 200) : '';
  const page = pageFrom(req.query.page);
  const payload = keyword ? await searchMovies({ keyword, page, limit: 20 }) : await getHomeUpdates(page);
  const data = unwrapPhimData(payload);
  const items = Array.isArray(data.items) ? data.items.map(asRecord).filter(movie => typeof movie.slug === 'string') : [];
  const managed = await ManagedMovie.find({ slug: { $in: items.map(movie => movie.slug) } }).select('slug isHidden').lean();
  const pagination = asRecord(asRecord(data.params).pagination || data.pagination || asRecord(payload).pagination);
  res.json({ success: true, data: items.map(movie => {
    const record = managed.find(entry => entry.slug === movie.slug);
    return { ...movie, managedId: record ? String(record._id) : undefined, isHidden: record?.isHidden };
  }), pagination: { page, limit: 20, total: Number(pagination.totalItems) || items.length, pages: Number(pagination.totalPages) || 1 } });
});

export const importMovie = asyncHandler(async (req: Request, res: Response) => {
  const slug = validateSlug(req.body.slug);
  const payload = asRecord(await getMovieBySlug(slug));
  const snapshot = asRecord(payload.movie);
  if (typeof snapshot.name !== 'string' || typeof snapshot.slug !== 'string') throw new ApiError(502, 'PhimAPI did not return a valid movie');
  const canonicalSlug = validateSlug(snapshot.slug);
  const tmdb = asRecord(snapshot.tmdb);
  const tmdbId = Number(tmdb.id);
  const mediaType = tmdb.type === 'tv' || snapshot.type === 'series' ? 'tv' : 'movie';
  // Refresh source metadata without resetting visibility, home flags or site overrides.
  const hasTmdbId = Number.isSafeInteger(tmdbId) && tmdbId > 0;
  const doc = await ManagedMovie.findOneAndUpdate({ slug: canonicalSlug }, {
    $setOnInsert: { slug: canonicalSlug, source: 'phimapi' },
    $set: { snapshot, mediaType, ...(hasTmdbId ? { tmdbId } : {}) },
    ...(!hasTmdbId ? { $unset: { tmdbId: '' } } : {}),
  }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }).lean();
  await logAdminAction(req, 'CREATE', 'MOVIE', String(doc!._id), { source: 'phimapi', slug: canonicalSlug });
  res.json({ success: true, data: await viewWithVisibility(doc), message: 'Movie added to the managed catalog' });
});

export const getMovie = asyncHandler(async (req: Request, res: Response) => {
  const doc = await ManagedMovie.findById(idFrom(req.params.id)).lean();
  if (!doc) throw new ApiError(404, 'Managed movie not found');
  res.json({ success: true, data: await viewWithVisibility(doc) });
});

export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const patch = parseMoviePatch(req.body);
  const doc = await ManagedMovie.findByIdAndUpdate(idFrom(req.params.id), { $set: patch }, { new: true, runValidators: true }).lean();
  if (!doc) throw new ApiError(404, 'Managed movie not found');
  await logAdminAction(req, 'UPDATE', 'MOVIE', String(doc._id), { slug: doc.slug, settings: patch });
  res.json({ success: true, data: await viewWithVisibility(doc), message: 'Movie settings saved' });
});

export const removeMovie = asyncHandler(async (req: Request, res: Response) => {
  const doc = await ManagedMovie.findByIdAndDelete(idFrom(req.params.id)).lean();
  if (!doc) throw new ApiError(404, 'Managed movie not found');
  await logAdminAction(req, 'DELETE', 'MOVIE', String(doc._id), { slug: doc.slug, action: 'Remove site settings only; restore source behavior' });
  res.json({ success: true, message: 'Management settings removed; source content and user activity are preserved' });
});

export const bulkAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, movieIds } = req.body;
  if (action !== 'remove' && !Object.prototype.hasOwnProperty.call(bulkMovieActions, action)) throw new ApiError(400, 'Invalid bulk action');
  if (!Array.isArray(movieIds) || !movieIds.length || movieIds.length > 100 || movieIds.some(id => typeof id !== 'string')) {
    throw new ApiError(400, 'Select between 1 and 100 managed movies');
  }
  const ids = [...new Set(movieIds.map(idFrom))];
  const count = await ManagedMovie.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) throw new ApiError(404, 'Some selected movies no longer exist; refresh the list');
  const result = action === 'remove'
    ? await ManagedMovie.deleteMany({ _id: { $in: ids } })
    : await ManagedMovie.updateMany({ _id: { $in: ids } }, { $set: bulkMovieActions[action as keyof typeof bulkMovieActions] });
  await logAdminAction(req, action === 'remove' ? 'DELETE' : 'UPDATE', 'MOVIE', undefined, { action, movieIds: ids });
  res.json({ success: true, modifiedCount: 'deletedCount' in result ? result.deletedCount : result.modifiedCount });
});

export const listGenres = asyncHandler(async (_req: Request, res: Response) => {
  const data = await ManagedMovie.aggregate([
    { $unwind: '$snapshot.category' },
    { $group: { _id: '$snapshot.category.name', count: { $sum: 1 } } }, { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data });
});
