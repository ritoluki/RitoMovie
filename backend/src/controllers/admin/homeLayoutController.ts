import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import ApiError from '../../utils/ApiError';
import ManagedMovie from '../../models/ManagedMovie';
import { HOME_SECTIONS, defaultHomeSettings, sectionCandidates, validateSectionPatch } from '../../utils/homeSections';
import { getHomeLayoutSettings, saveHomeLayout, homeEditorContext, homeEditorView, normalizedTmdbSnapshot } from '../../services/homeLayoutService';
import { logAdminAction } from '../../middleware/adminAuth';

const languageOf = (req: Request) => (req as { language?: string }).language || 'en';
const definitionOf = (id: string) => {
  const definition = HOME_SECTIONS.find(section => section.id === id);
  if (!definition) throw new ApiError(404, 'Unknown home section');
  return definition;
};
const respond = async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ success: true, data: await homeEditorView(languageOf(req)) });
};

export const getLayout = asyncHandler(respond);

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const definition = definitionOf(req.params.id);
  const { layout, data } = await homeEditorContext(languageOf(req));
  const current = layout.sections.find(section => section.id === definition.id)!;
  const { map } = sectionCandidates(data, definition, current);
  const updated = validateSectionPatch(req.body, current, map);
  if (updated.pinnedIds.length > definition.limit) throw new ApiError(400, `This section supports at most ${definition.limit} pinned movies`);
  await saveHomeLayout(req.body.revision, layout.sections.map(section => section.id === definition.id ? updated : section));
  await logAdminAction(req, 'UPDATE', 'SETTINGS', 'home', { section: definition.id, fields: Object.keys(req.body) });
  await respond(req, res);
});

export const reorderSections = asyncHandler(async (req: Request, res: Response) => {
  const ids = req.body.order;
  if (!Array.isArray(ids) || ids.length !== HOME_SECTIONS.length || new Set(ids).size !== ids.length || ids[0] !== 'hero' || ids.some(id => !HOME_SECTIONS.some(section => section.id === id))) {
    throw new ApiError(400, 'Provide every home section exactly once. The hero banner stays at the top.');
  }
  const layout = await getHomeLayoutSettings();
  await saveHomeLayout(req.body.revision, layout.sections.map(section => ({ ...section, order: ids.indexOf(section.id) })));
  await logAdminAction(req, 'UPDATE', 'SETTINGS', 'home', { action: 'Reorder home sections', order: ids });
  await respond(req, res);
});

export const resetLayout = asyncHandler(async (req: Request, res: Response) => {
  await saveHomeLayout(req.body.revision, defaultHomeSettings());
  await logAdminAction(req, 'UPDATE', 'SETTINGS', 'home', { action: 'Reset home layout; global movie visibility preserved' });
  await respond(req, res);
});

export const setGlobalVisibility = asyncHandler(async (req: Request, res: Response) => {
  if (typeof req.body.hidden !== 'boolean' || typeof req.body.key !== 'string') throw new ApiError(400, 'A movie key and boolean hidden state are required');
  const definition = definitionOf(req.params.id);
  const { data, layout } = await homeEditorContext(languageOf(req));
  const settings = layout.sections.find(section => section.id === definition.id)!;
  const { map } = sectionCandidates(data, definition, settings);
  const original = map.get(req.body.key);
  if (!original) throw new ApiError(400, 'This movie is no longer in the section. Reload its source data.');
  const tmdb = req.body.key.startsWith('tmdb:');
  const snapshot = tmdb ? normalizedTmdbSnapshot(original) : original;
  const tmdbId = Number(snapshot.tmdb?.id);
  const mediaType = snapshot.tmdb?.type === 'tv' ? 'tv' : 'movie';
  const hasId = Number.isSafeInteger(tmdbId) && tmdbId > 0;
  if (!req.body.hidden && hasId) {
    // Showing a canonical title clears the policies that currently block that title.
    const query = tmdb ? { tmdbId, mediaType } : { $or: [{ slug: snapshot.slug }, { source: 'tmdb', tmdbId, mediaType }] };
    await ManagedMovie.updateMany(query, { $set: { isHidden: false } });
  }
  await ManagedMovie.findOneAndUpdate({ slug: snapshot.slug }, {
    $set: { isHidden: req.body.hidden },
    $setOnInsert: { source: tmdb ? 'tmdb' : 'phimapi', snapshot, mediaType, ...(hasId ? { tmdbId } : {}) },
  }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
  await logAdminAction(req, 'UPDATE', 'MOVIE', undefined, { key: req.body.key, isHidden: req.body.hidden, scope: 'website' });
  await respond(req, res);
});
