import { ProcessedFile, getFileInfo } from "../../../common/file-utils.js";
import { ContentBlock } from "../../llm/types.js";

export default function processImageFile(
  file: ProcessedFile,
  fileInfo: ReturnType<typeof getFileInfo>
): ContentBlock {
  // Convert image buffer to base64
  const base64Image = file.buffer.toString("base64");

  // Use the existing mimetype from fileInfo, or determine from filename extension
  const mimeType = fileInfo.mimetype;

  return {
    type: "image_url",
    image_url: {
      url: `data:${mimeType};base64,${base64Image}`,
    },
  };
}
