import { FileUpload } from "graphql-upload/processRequest.mjs";

// File validation constants
export const FILE_VALIDATION_CONFIG = {
  MAX_FILES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LINE_LENGTH: 10000, // For text file validation
} as const;

// Simplified MIME type categories
const MIME_TYPES = {
  images: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  text: [
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "text/xml",
    "text/csv",
    "text/markdown",
  ],
  code: [
    "application/json",
    "application/javascript",
    "application/xml",
    "application/x-yaml",
    "application/yaml",
  ],
} as const;

// Extension to MIME type mapping
const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  // Text
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  xml: "application/xml",
  // Code
  js: "text/javascript",
  mjs: "text/javascript",
  jsx: "text/javascript",
  json: "application/json",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  ts: "application/x-typescript",
  tsx: "application/x-typescript",
  py: "application/x-python-code",
  php: "application/x-php",
  rb: "application/x-ruby",
  java: "application/x-java-source",
  c: "application/x-c",
  cpp: "application/x-cpp",
  cs: "application/x-csharp",
  go: "application/x-go",
  rs: "application/x-rust",
  swift: "application/x-swift",
  kt: "application/x-kotlin",
  scala: "application/x-scala",
  r: "application/x-r",
  sql: "application/x-sql",
  sh: "application/x-shell",
  bash: "application/x-shell",
  ps1: "application/x-powershell",
  dockerfile: "application/x-dockerfile",
};

// Get all supported MIME types
export const SUPPORTED_MIME_TYPES = [
  ...MIME_TYPES.images,
  ...MIME_TYPES.text,
  ...MIME_TYPES.code,
  ...Object.values(EXTENSION_TO_MIME),
].filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates

export interface FileValidationError {
  type:
    | "COUNT_EXCEEDED"
    | "SIZE_EXCEEDED"
    | "UNSUPPORTED_TYPE"
    | "INVALID_FILE";
  message: string;
  fileName?: string;
}

export interface ProcessedFile {
  file: FileUpload;
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
      type: "COUNT_EXCEEDED",
      message: `Maximum ${FILE_VALIDATION_CONFIG.MAX_FILES} files allowed. You uploaded ${files.length} files.`,
    });
    return { files: [], errors };
  }

  // Process each file
  for (const fileUpload of files) {
    try {
      const { createReadStream, filename, mimetype, encoding } =
        await fileUpload;

      // Validate MIME type - with fallback to extension-based detection
      let finalMimetype = mimetype;

      if (!SUPPORTED_MIME_TYPES.includes(mimetype)) {
        // Try to detect MIME type from extension as fallback
        const detectedMimetype = getFileTypeFromExtension(filename);

        if (
          detectedMimetype &&
          SUPPORTED_MIME_TYPES.includes(detectedMimetype)
        ) {
          finalMimetype = detectedMimetype;
        } else {
          errors.push({
            type: "UNSUPPORTED_TYPE",
            message: `Unsupported file type: ${mimetype}${
              detectedMimetype
                ? ` (detected as ${detectedMimetype} from extension but still unsupported)`
                : ""
            }`,
            fileName: filename,
          });
          continue;
        }
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
          type: "SIZE_EXCEEDED",
          message: `File "${filename}" exceeds maximum size of ${
            FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
          }MB. File size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
          fileName: filename,
        });
        continue;
      }

      // Additional validation for text files - ensure they're valid UTF-8
      if (isTextBasedFile(finalMimetype)) {
        const textValidation = validateTextFileContent(buffer, filename);
        if (!textValidation.isValid) {
          errors.push({
            type: "INVALID_FILE",
            message:
              textValidation.error ||
              `File "${filename}" is not valid UTF-8 text`,
            fileName: filename,
          });
          continue;
        }
      }

      // If all validations pass, add to processed files
      processedFiles.push({
        file: fileUpload,
        filename,
        mimetype: finalMimetype, // Use the final determined MIME type
        size: fileSize,
        buffer,
        encoding,
      });
    } catch (error) {
      errors.push({
        type: "INVALID_FILE",
        message: `Failed to process file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        fileName: "unknown",
      });
    }
  }

  return { files: processedFiles, errors };
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function getFileTypeFromExtension(filename: string): string | null {
  const extension = getFileExtension(filename);
  return EXTENSION_TO_MIME[extension] || null;
}

// File type detection
export function isImageFile(mimetype: string): boolean {
  return mimetype.startsWith("image/");
}

export function isTextBasedFile(mimetype: string): boolean {
  return (
    mimetype.startsWith("text/") ||
    mimetype.startsWith("application/json") ||
    mimetype.startsWith("application/javascript") ||
    mimetype.startsWith("application/xml") ||
    mimetype.startsWith("application/x-yaml") ||
    mimetype.startsWith("application/yaml") ||
    mimetype.startsWith("application/x-")
  );
}

export function getFileTypeCategory(
  mimetype: string
): "image" | "text" | "unknown" {
  if (isImageFile(mimetype)) return "image";
  if (isTextBasedFile(mimetype)) return "text";
  return "unknown";
}

// Text validation functions
export function isValidUTF8(buffer: Buffer): boolean {
  try {
    const text = buffer.toString("utf8");
    const reencoded = Buffer.from(text, "utf8");
    return reencoded.equals(buffer);
  } catch {
    return false;
  }
}

export function getTextContent(buffer: Buffer): string | null {
  try {
    if (!isValidUTF8(buffer)) return null;

    const text = buffer.toString("utf8");
    if (text.includes("\0")) return null; // No null bytes in text files

    return text;
  } catch {
    return null;
  }
}

export function validateTextFileContent(
  buffer: Buffer,
  filename: string
): { isValid: boolean; error?: string } {
  if (!isValidUTF8(buffer)) {
    return {
      isValid: false,
      error: `File "${filename}" is not valid UTF-8 text`,
    };
  }

  const textContent = getTextContent(buffer);
  if (textContent === null) {
    return {
      isValid: false,
      error: `File "${filename}" contains invalid characters for a text file`,
    };
  }

  // Check for extremely long lines that might indicate binary content
  const hasLongLines = textContent
    .split("\n")
    .some((line) => line.length > FILE_VALIDATION_CONFIG.MAX_LINE_LENGTH);
  if (hasLongLines) {
    return {
      isValid: false,
      error: `File "${filename}" contains lines that are too long (possible binary content)`,
    };
  }

  return { isValid: true };
}

// Helper functions for processed files
export function extractTextFromProcessedFile(
  file: ProcessedFile
): string | null {
  if (!isTextBasedFile(file.mimetype)) return null;
  return getTextContent(file.buffer);
}

export function getFileInfo(file: ProcessedFile): {
  filename: string;
  mimetype: string;
  size: string;
  category: "image" | "text" | "unknown";
  isTextBased: boolean;
  encoding: string;
} {
  return {
    filename: file.filename,
    mimetype: file.mimetype,
    size: formatFileSize(file.size),
    category: getFileTypeCategory(file.mimetype),
    isTextBased: isTextBasedFile(file.mimetype),
    encoding: file.encoding,
  };
}
