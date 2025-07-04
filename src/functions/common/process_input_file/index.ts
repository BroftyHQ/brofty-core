import { ContentBlock, Message } from "../../llm/types.js";
import {
  ProcessedFile,
  getFileInfo,
  isImageFile,
} from "../../../common/file-utils.js";
import processTextFile from "./processTextFile.js";
import processImageFile from "./processImageFile.js";

export default async function process_input_file({
  file,
}: {
  file: ProcessedFile;
}): Promise<ContentBlock | null> {
  const fileInfo = getFileInfo(file);

  // Handle text-based files (text, code, document)
  if (fileInfo.isTextBased) {
    return processTextFile(file, fileInfo);
  }

  // Handle image files (prepared for future implementation)
  if (isImageFile(file.mimetype)) {
    return processImageFile(file, fileInfo);
  }

  // Unknown or unsupported file type
  return {
    type: "text",
    text: `Uploaded file "${file.filename}" (${fileInfo.size}, ${file.mimetype}) - File type not yet supported for processing.`,
  };
}
