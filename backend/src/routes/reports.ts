import { Router } from 'express';
import { protect } from '../middleware/auth';
import { createReport } from '../controllers/reportController';

const router = Router();
router.post('/', protect, createReport);
export default router;
