import { ProcessedFile } from './file-utils.js';

export function createFileContextSummary(files: ProcessedFile[]): string {
  if (files.length === 0) return '';

  const fileSummaries = files.map((file, index) => {
    const fileInfo = [
      `File ${index + 1}: ${file.filename}`,
      `Type: ${file.mimetype}`,
      `Size: ${formatFileSize(file.size)}`,
      `Encoding: ${file.encoding}`
    ];

    // Add content preview for text files
    if (isTextFile(file.mimetype)) {
      try {
        const content = file.buffer.toString('utf-8');
        const preview = content.length > 500 ? content.substring(0, 500) + '...' : content;
        fileInfo.push(`Content preview: ${preview}`);
      } catch (error) {
        fileInfo.push('Content: Unable to preview content');
      }
    } else if (file.mimetype.startsWith('image/')) {
      fileInfo.push('Content: Image file (visual content)');
    } else {
      fileInfo.push('Content: Binary file (non-text content)');
    }

    return fileInfo.join('\n');
  });

  return `\n\n--- Attached Files ---\n${fileSummaries.join('\n\n')}\n--- End of Attachments ---\n`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isTextFile(mimetype: string): boolean {
  const textTypes = [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'application/x-python-code',
    'application/x-javascript',
    'application/x-typescript',
    'text/x-python',
    'text/x-javascript',
    'text/x-typescript'
  ];
  return textTypes.includes(mimetype) || mimetype.startsWith('text/');
}
