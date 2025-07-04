import * as fs from "fs";
import * as path from "path";
import logger from "../../common/logger.js";
import { ProcessedFile } from "../../common/file-utils.js";

const STATIC_INPUT_DIR = path.join(process.cwd(), "static", "input");

/**
 * Save uploaded files to static/input/{user_message_id}/
 * @param files - Array of processed files
 * @param user_message_id - The message ID to organize files by
 * @returns Promise<string[]> - Array of saved file paths
 */
export async function saveFilesToStaticInput(
  files: ProcessedFile[],
  user_message_id: string
): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  // Create the directory for this message's files
  const messageDir = path.join(STATIC_INPUT_DIR, user_message_id);

  try {
    // Ensure the directory exists
    await fs.promises.mkdir(messageDir, { recursive: true });

    const savedPaths: string[] = [];

    for (const file of files) {
      // Generate a safe filename (preserve original name but avoid conflicts)
      const timestamp = Date.now();
      const ext = path.extname(file.filename);
      const baseName = path.basename(file.filename, ext);
      const safeFilename = `${baseName}_${timestamp}${ext}`;

      const filePath = path.join(messageDir, safeFilename);

      // Write the file buffer to disk
      await fs.promises.writeFile(filePath, file.buffer);

      savedPaths.push(filePath);

      logger.info(
        `Saved file: ${file.filename} -> ${path.relative(process.cwd(), filePath)} (${file.size} bytes)`
      );
    }

    return savedPaths;
  } catch (error) {
    logger.error(`Failed to save files to static/input/${user_message_id}:`, error);
    throw new Error(
      `Failed to save files: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Save files with error handling and logging
 * @param files - Array of processed files
 * @param user_message_id - The message ID to organize files by
 * @returns Promise<void> - Resolves when files are saved or error is logged
 */
export async function saveFilesWithErrorHandling(
  files: ProcessedFile[],
  user_message_id: string
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  try {
    const savedFilePaths = await saveFilesToStaticInput(files, user_message_id);
    logger.info(`Successfully saved ${savedFilePaths.length} files for message ${user_message_id}`);
  } catch (error) {
    logger.error(`Failed to save files for message ${user_message_id}:`, error);
    // Continue with the message processing even if file saving fails
    // The files are already processed and available in memory
  }
}
