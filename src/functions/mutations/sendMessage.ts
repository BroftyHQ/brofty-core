import { nanoid } from "nanoid";
import pubsub from "../../pubsub/index.js";
import { AuthorizedGraphQLContext } from "../../types/context.js";
import { message_model } from "../../db/sqlite/models.js";
import { DateTime } from "luxon";
import generate_response from "../llm/generate_response.js";
import { validateAndProcessFiles, FileValidationError } from "../../common/file-utils.js";
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import logger from "../../common/logger.js";

export async function sendMessage(
  _parent: any,
  args: { message: string; files?: FileUpload[] },
  context: AuthorizedGraphQLContext,
  _info: any
) {
  if(args.message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  // Validate and log files if provided
  if (args.files && args.files.length > 0) {
    logger.info(`Received ${args.files.length} file(s) for processing`);
    
    const { files, errors } = await validateAndProcessFiles(args.files);
    
    // If there are validation errors, throw an error with details
    if (errors.length > 0) {
      const errorMessages = errors.map(error => error.message).join('; ');
      logger.error(`File validation failed: ${errorMessages}`);
      throw new Error(`File validation failed: ${errorMessages}`);
    }
    
    // Log successfully processed files
    files.forEach((file, index) => {
      logger.info(`File ${index + 1}: ${file.filename} (${file.mimetype}, ${(file.size / 1024).toFixed(2)} KB)`);
    });
    
    logger.info(`Successfully validated and processed ${files.length} file(s)`);
  }

  // Original sendMessage logic remains unchanged
  const message: any = await message_model.create({
    id: nanoid(),
    text: args.message,
    by: "User",
    created_at: DateTime.now().toMillis(),
    updated_at: DateTime.now().toMillis(),
  });
  
  pubsub.publish(`MESSAGE_STREAM`, {
    messageStream: {
      type: "NEW_MESSAGE",
      by: "You",
      id: message.id,
      text: message.text,
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
    messsage: args.message,
    initial_response_time: message.created_at.toString(),
    tool_calls: [],
    recursion_count: 0,
    functions_suggestions: ["tool_search"]
  });
  
  return message;
}
