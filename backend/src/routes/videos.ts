import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadVideo,
  streamVideo,
  getVideoDetails,
  getAllVideos,
  updateVideo,
  deleteVideo,
} from '../controllers/videoController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept video files only
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});

// Public routes
router.get('/', getAllVideos);
router.get('/:id', getVideoDetails);
router.get('/:id/stream', streamVideo);

// Private routes (Admin only)
router.post('/upload', protect, authorize('admin'), upload.single('video'), uploadVideo);
router.put('/:id', protect, authorize('admin'), updateVideo);
router.delete('/:id', protect, authorize('admin'), deleteVideo);

export default router;

