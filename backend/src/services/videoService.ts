import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Create uploads directory if it doesn't exist
export const ensureUploadDir = async (): Promise<void> => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'videos');
  
  try {
    await mkdirAsync(uploadDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
};

// Delete video file
export const deleteVideoFile = async (filename: string): Promise<void> => {
  const filePath = path.join(process.cwd(), 'uploads', 'videos', filename);
  
  try {
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Get video file path
export const getVideoPath = (filename: string): string => {
  return path.join(process.cwd(), 'uploads', 'videos', filename);
};

// Check if video file exists
export const videoExists = (filename: string): boolean => {
  const filePath = getVideoPath(filename);
  return fs.existsSync(filePath);
};

// Get video file stats
export const getVideoStats = (filename: string) => {
  const filePath = getVideoPath(filename);
  return fs.statSync(filePath);
};

/**
 * Process video to HLS format using FFmpeg
 * Note: This requires FFmpeg to be installed on the system
 * 
 * Example command:
 * ffmpeg -i input.mp4 \
 *   -codec: copy \
 *   -start_number 0 \
 *   -hls_time 10 \
 *   -hls_list_size 0 \
 *   -f hls \
 *   output.m3u8
 */
export const processVideoToHLS = async (
  inputPath: string,
  _outputDir: string
): Promise<string> => {
  // This is a placeholder for HLS conversion
  // In production, you would use fluent-ffmpeg or spawn FFmpeg process
  
  // Example using fluent-ffmpeg (would need to be installed):
  /*
  const ffmpeg = require('fluent-ffmpeg');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-codec: copy',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(path.join(outputDir, 'output.m3u8'))
      .on('end', () => resolve(path.join(outputDir, 'output.m3u8')))
      .on('error', (err) => reject(err))
      .run();
  });
  */
  
  // For now, return the input path
  // User needs to implement FFmpeg integration based on their needs
  console.warn('HLS processing not implemented. FFmpeg integration required.');
  return inputPath;
};

// Generate different quality versions
export const generateVideoQualities = async (
  inputPath: string,
  _outputDir: string
): Promise<{ [quality: string]: string }> => {
  // Placeholder for quality generation
  // Would use FFmpeg to create 360p, 480p, 720p, 1080p versions
  
  console.warn('Video quality generation not implemented. FFmpeg integration required.');
  
  return {
    original: inputPath,
  };
};

