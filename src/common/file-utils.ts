import { FileUpload } from 'graphql-upload/processRequest.mjs';

// File validation constants
export const FILE_VALIDATION_CONFIG = {
  MAX_FILES: 10, // Maximum number of files allowed
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  SUPPORTED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]
};

export interface FileValidationError {
  type: 'COUNT_EXCEEDED' | 'SIZE_EXCEEDED' | 'UNSUPPORTED_TYPE' | 'INVALID_FILE';
  message: string;
  fileName?: string;
}

export interface ProcessedFile {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  encoding: string;
}

export async function validateAndProcessFiles(
  files: FileUpload[] | null | undefined
): Promise<{ files: ProcessedFile[]; errors: FileValidationError[] }> {
  const errors: FileValidationError[] = [];
  const processedFiles: ProcessedFile[] = [];

  // Check if files array is provided
  if (!files || files.length === 0) {
    return { files: [], errors: [] };
  }

  // Check file count limit
  if (files.length > FILE_VALIDATION_CONFIG.MAX_FILES) {
    errors.push({
      type: 'COUNT_EXCEEDED',
      message: `Maximum ${FILE_VALIDATION_CONFIG.MAX_FILES} files allowed. You uploaded ${files.length} files.`
    });
    return { files: [], errors };
  }

  // Process each file
  for (const fileUpload of files) {
    try {
      const { createReadStream, filename, mimetype, encoding } = await fileUpload;
      
      // Validate MIME type
      if (!FILE_VALIDATION_CONFIG.SUPPORTED_MIME_TYPES.includes(mimetype)) {
        errors.push({
          type: 'UNSUPPORTED_TYPE',
          message: `Unsupported file type: ${mimetype}`,
          fileName: filename
        });
        continue;
      }

      // Read file into buffer to check size
      const stream = createReadStream();
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      const fileSize = buffer.length;

      // Check file size limit
      if (fileSize > FILE_VALIDATION_CONFIG.MAX_FILE_SIZE) {
        errors.push({
          type: 'SIZE_EXCEEDED',
          message: `File "${filename}" exceeds maximum size of ${FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB. File size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
          fileName: filename
        });
        continue;
      }

      // If all validations pass, add to processed files
      processedFiles.push({
        filename,
        mimetype,
        size: fileSize,
        buffer,
        encoding
      });

    } catch (error) {
      errors.push({
        type: 'INVALID_FILE',
        message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fileName: 'unknown'
      });
    }
  }

  return { files: processedFiles, errors };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

export function isDocumentFile(mimetype: string): boolean {
  // Since we only support images now, this function returns false for all types
  return false;
}
