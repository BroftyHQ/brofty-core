import { nanoid } from "nanoid";
import pubsub from "../../pubsub/index.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import generate_response from "../llm/generate_response.js";
import {
  validateAndProcessFiles,
  FileValidationError,
  ProcessedFile,
} from "../../common/file-utils.js";
import { FileUpload } from "graphql-upload/processRequest.mjs";
import logger from "../../common/logger.js";
import { ContentBlock, Message } from "../llm/types.js";
import process_input_file from "../common/process_input_file/index.js";
import { saveFilesWithErrorHandling } from "../common/save_files_to_static.js";

export async function sendMessage(
  _parent: any,
  args: { message: string; files?: FileUpload[], webSearch?: boolean },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  const user_query = args.message.trim();
  if (user_query === "") {
    throw new Error("Message cannot be empty");
  }
  let user_message: Message = {
    role: "user",
    content: [
      {
        type: "text",
        text: user_query,
      },
    ],
  };

  let processedFiles: ProcessedFile[] = [];

  // Validate and log files if provided
  if (args.files && args.files.length > 0) {
    logger.info(`Received ${args.files.length} file(s) for processing`);

    const { files, errors } = await validateAndProcessFiles(args.files);

    // Store processed files for later saving
    processedFiles = files;

    // If there are validation errors, throw an error with details
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => error.message).join("; ");
      logger.error(`File validation failed: ${errorMessages}`);
      throw new Error(`File validation failed: ${errorMessages}`);
    }

    for await (const file of files) {
      logger.info(
        `Processing file: ${file.filename}, size: ${file.size} bytes`
      );
      const response: ContentBlock = await process_input_file({
        file,
      });

      if (response && response.type) {
        (user_message.content as ContentBlock[]).push(response);
      } else {
        throw new Error(
          `Failed to process file: ${file.filename} (missing required 'type' property)`
        );
      }
    }
  }

  const user_message_id = nanoid();

  // Write all input files to static/input folder by user_message_id
  if (processedFiles.length > 0) {
    await saveFilesWithErrorHandling(processedFiles, user_message_id);
  }

  // Prepare file references for database storage
  const fileReferences =
    processedFiles.length > 0
      ? processedFiles.map((file) => ({
          filename: file.sanitizedFilename,
          size: file.size,
          mimetype: file.mimetype,
          encoding: file.encoding,
          path: `/resources/input/${user_message_id}/${file.sanitizedFilename}`,
        }))
      : null;

  // Original sendMessage logic remains unchanged
  const message: any = await message_model.create({
    id: user_message_id,
    text: user_query,
    by: "User",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
    files: fileReferences,
  });

  pubsub.publish(`MESSAGE_STREAM`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "You",
      id: message.id,
      text: message.text,
      files: fileReferences
        ? fileReferences.map((file) => ({
            filename: file.filename,
            mimetype: file.mimetype,
            path: file.path,
            size: file.size,
          }))
        : [],
      created_at: message.created_at.toString(),
    },
  });

  const response: any = await message_model.create({
    id: nanoid(),
    text: "",
    by: "AI",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
  });

  pubsub.publish(`MESSAGE_STREAM`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "AI",
      id: response.id,
      text: "",
      created_at: message.created_at.toString(),
    },
  });

  generate_response({
    id: response.id,
    user_token: context.user.token,
    user_query: user_query,
    user_message: user_message,
    initial_response_time: message.created_at.toString(),
    tool_calls: [],
    recursion_count: 0,
    functions_suggestions: ["tool_search"],
    enable_web_search: args.webSearch || false,
  });

  return {
    id: message.id,
    text: message.text,
    by: message.by,
    files: fileReferences
      ? fileReferences.map((file) => ({
          filename: file.filename,
          mimetype: file.mimetype,
          path: file.path,
          size: file.size,
        }))
      : [],
    created_at: message.created_at.toString(),
  };
}
