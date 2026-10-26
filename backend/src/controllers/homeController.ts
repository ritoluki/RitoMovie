import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { getHomeSourceData } from '../services/homeDataService';

export const getHomePageBatch = asyncHandler(async (req: Request, res: Response) => {
  const language = (req as { language?: string }).language || 'en';
  const result = await getHomeSourceData(language);
  res.json({ success: true, ...result, timestamp: new Date().toISOString() });
});
