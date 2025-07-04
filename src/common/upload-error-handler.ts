import { Request, Response, NextFunction } from 'express';
import { FILE_VALIDATION_CONFIG } from './file-utils.js';
import logger from './logger.js';

/**
 * Custom error handling middleware for file uploads
 * Handles various file upload errors gracefully and returns appropriate HTTP responses
 */
export const fileUploadErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error && error.message && error.message.includes('File size limit exceeded')) {
    return res.status(413).json({
      errors: [{
        message: `File size exceeds the maximum allowed size of ${FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        extensions: {
          code: 'FILE_SIZE_EXCEEDED',
          maxFileSize: FILE_VALIDATION_CONFIG.MAX_FILE_SIZE
        }
      }]
    });
  }
  
  if (error && error.message && error.message.includes('Too many files')) {
    return res.status(413).json({
      errors: [{
        message: `Maximum ${FILE_VALIDATION_CONFIG.MAX_FILES} files allowed`,
        extensions: {
          code: 'FILE_COUNT_EXCEEDED',
          maxFiles: FILE_VALIDATION_CONFIG.MAX_FILES
        }
      }]
    });
  }
  
  if (error && error.message && error.message.includes('Unsupported Media Type')) {
    return res.status(415).json({
      errors: [{
        message: 'Unsupported file type. Please upload supported file types.',
        extensions: {
          code: 'UNSUPPORTED_FILE_TYPE',
          supportedTypes: FILE_VALIDATION_CONFIG.SUPPORTED_MIME_TYPES
        }
      }]
    });
  }
  
  // Log the error for debugging
  logger.error('File upload error:', error);
  
  // For other upload-related errors, return a generic error
  if (error && (error.message.includes('upload') || error.message.includes('multipart'))) {
    return res.status(400).json({
      errors: [{
        message: 'File upload failed. Please check your file and try again.',
        extensions: {
          code: 'FILE_UPLOAD_ERROR'
        }
      }]
    });
  }
  
  // Pass other errors to the next middleware
  next(error);
};
