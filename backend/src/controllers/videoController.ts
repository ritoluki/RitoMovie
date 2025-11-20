import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import Movie from '../models/Movie';
import * as videoService from '../services/videoService';

// @desc    Upload video
// @route   POST /api/videos/upload
// @access  Private (Admin only)
export const uploadVideo = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    if (!req.file) {
      throw new ApiError(400, 'Please upload a video file');
    }

    const { title, description, poster, backdrop, duration, genres, releaseDate, tmdbId } =
      req.body;

    // Validate required fields
    if (!title || !description || !poster || !backdrop || !duration) {
      // Delete uploaded file if validation fails
      await videoService.deleteVideoFile(req.file.filename);
      throw new ApiError(400, 'Please provide all required fields');
    }

    // Create movie record
    const movie = await Movie.create({
      title,
      description,
      poster,
      backdrop,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      duration: parseInt(duration),
      quality: ['original'],
      genres: JSON.parse(genres || '[]'),
      releaseDate: new Date(releaseDate),
      tmdbId: tmdbId ? parseInt(tmdbId) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: movie,
    });
  }
);

// @desc    Stream video
// @route   GET /api/videos/:id/stream
// @access  Public
export const streamVideo = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movieId = req.params.id;

    // Get movie from database
    const movie = await Movie.findById(movieId);

    if (!movie) {
      throw new ApiError(404, 'Movie not found');
    }

    // Get video file path
    const videoFileName = path.basename(movie.videoUrl);
    const videoPath = videoService.getVideoPath(videoFileName);

    // Check if file exists
    if (!videoService.videoExists(videoFileName)) {
      throw new ApiError(404, 'Video file not found');
    }

    // Get file stats
    const stat = videoService.getVideoStats(videoFileName);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Create read stream
      const file = fs.createReadStream(videoPath, { start, end });

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });

      // Pipe video stream
      file.pipe(res);
    } else {
      // No range header, stream entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      // Create read stream and pipe
      fs.createReadStream(videoPath).pipe(res);
    }
  }
);

// @desc    Get video details
// @route   GET /api/videos/:id
// @access  Public
export const getVideoDetails = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      throw new ApiError(404, 'Video not found');
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  }
);

// @desc    Get all uploaded videos
// @route   GET /api/videos
// @access  Public
export const getAllVideos = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const videos = await Movie.find().skip(skip).limit(limit).sort('-createdAt');
    const total = await Movie.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private (Admin only)
export const updateVideo = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      throw new ApiError(404, 'Video not found');
    }

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: movie,
    });
  }
);

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private (Admin only)
export const deleteVideo = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      throw new ApiError(404, 'Video not found');
    }

    // Delete video file
    const videoFileName = path.basename(movie.videoUrl);
    try {
      await videoService.deleteVideoFile(videoFileName);
    } catch (error) {
      console.error('Error deleting video file:', error);
    }

    // Delete movie record
    await movie.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  }
);

