import {
  extractTextFromProcessedFile,
  getFileTypeCategory,
  ProcessedFile,
  getFileInfo,
} from "../../../common/file-utils.js";
import { ContentBlock, Message } from "../../llm/types.js";

export default function processTextFile(
  file: ProcessedFile,
  fileInfo: ReturnType<typeof getFileInfo>
): ContentBlock {
  const textContent = extractTextFromProcessedFile(file);

  if (!textContent) {
    return {
      type: "text",
      text: `Failed to extract text content from file "${file.filename}".`,
    };
  }

  const category = getFileTypeCategory(file.mimetype);
  const fileDescription = getFileDescription(
    category,
    file.filename,
    fileInfo.size
  );

  // Truncate very long content to prevent token limits
  const maxContentLength = 50000; // Adjust based on your needs
  const truncatedContent =
    textContent.length > maxContentLength
      ? textContent.substring(0, maxContentLength) +
        `\n\n[Content truncated - original file was ${textContent.length} characters]`
      : textContent;

  return {
    type: "text",
    text: `${fileDescription}\n\n\`\`\`${getLanguageFromMimetype(
      file.mimetype
    )}\n${truncatedContent}\n\`\`\``,
  };
}

function getFileDescription(
  category: string,
  filename: string,
  size: string
): string {
  const descriptions = {
    text: "Text file",
    code: "Code file",
    document: "Document file",
    image: "Image file",
    unknown: "File",
  };

  const description =
    descriptions[category as keyof typeof descriptions] || "File";
  return `${description} "${filename}" (${size}):`;
}

function getLanguageFromMimetype(mimetype: string): string {
  const mimetypeToLanguage: { [key: string]: string } = {
    "text/javascript": "javascript",
    "application/javascript": "javascript",
    "text/x-javascript": "javascript",
    "application/x-typescript": "typescript",
    "text/x-typescript": "typescript",
    "application/json": "json",
    "text/html": "html",
    "text/css": "css",
    "application/xml": "xml",
    "text/xml": "xml",
    "application/x-yaml": "yaml",
    "application/yaml": "yaml",
    "application/x-python-code": "python",
    "text/x-python": "python",
    "application/x-php": "php",
    "application/x-ruby": "ruby",
    "application/x-java-source": "java",
    "text/x-java-source": "java",
    "application/x-c": "c",
    "text/x-c": "c",
    "application/x-cpp": "cpp",
    "text/x-cpp": "cpp",
    "application/x-csharp": "csharp",
    "text/x-csharp": "csharp",
    "application/x-go": "go",
    "text/x-go": "go",
    "application/x-rust": "rust",
    "text/x-rust": "rust",
    "application/x-swift": "swift",
    "text/x-swift": "swift",
    "application/x-kotlin": "kotlin",
    "text/x-kotlin": "kotlin",
    "application/x-scala": "scala",
    "text/x-scala": "scala",
    "application/x-r": "r",
    "text/x-r": "r",
    "application/x-sql": "sql",
    "text/x-sql": "sql",
    "application/x-shell": "bash",
    "text/x-shell": "bash",
    "application/x-powershell": "powershell",
    "text/x-powershell": "powershell",
    "application/x-dockerfile": "dockerfile",
    "text/x-dockerfile": "dockerfile",
    "text/markdown": "markdown",
    "text/csv": "csv",
    "text/plain": "text",
  };

  return mimetypeToLanguage[mimetype] || "text";
}
