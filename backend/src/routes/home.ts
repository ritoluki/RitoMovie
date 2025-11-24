import { Router } from 'express';
import { getHomePageBatch } from '../controllers/homeController';

const router = Router();

/**
 * @route   GET /api/home/batch
 * @desc    Get all home page data in a single batch request
 * @access  Public
 */
router.get('/batch', getHomePageBatch);

export default router;
