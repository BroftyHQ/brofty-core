import pubsub from "../../pubsub/index.js";
import logger from "../../common/logger.js";
import { FunctionCache } from "./types.js";

export class StreamProcessor {
  private chunk_cache: string = "";
  private function_cache: { [key: number]: FunctionCache } = {};

  public processStreamEvent(
    event: any,
    id: string,
    initial_response_time: string
  ): { finalText: string; hasContent: boolean; hasFunctionCalls: boolean } {
    if (event.object !== "chat.completion.chunk") {
      logger.error(
        `Unhandled event type: ${event.object} - Event: ${JSON.stringify(event)}`
      );
      return { finalText: "", hasContent: false, hasFunctionCalls: false };
    }

    const first_choice = event.choices[0];
    
    // Handle content chunks
    if (first_choice.delta.content) {
      this.chunk_cache += event.choices[0].delta.content || "";
      pubsub.publish(`MESSAGE_STREAM`, {
        messageStream: {
          type: "APPEND_MESSAGE",
          id,
          text: event.choices[0].delta.content || "",
          by: "AI",
          createdAt: initial_response_time.toString(),
        },
      });
    }

    // Handle function calls
    if (first_choice.delta.content === null && first_choice.delta.tool_calls) {
      if (first_choice.delta.tool_calls[0].function.name) {
        const index = first_choice.delta.tool_calls[0].index;
        if (!this.function_cache[index]) {
          this.function_cache[index] = {
            name: "",
            arguments: "",
            tool_call_id: "",
          };
        }
        this.function_cache[index].name = first_choice.delta.tool_calls[0].function.name;
        this.function_cache[index].tool_call_id = first_choice.delta.tool_calls[0].id;
      }
      if (first_choice.delta.tool_calls[0].function.arguments) {
        const index = first_choice.delta.tool_calls[0].index;
        if (this.function_cache[index]) {
          this.function_cache[index].arguments += first_choice.delta.tool_calls[0].function.arguments;
        }
      }
    }

    // Handle completion
    if (first_choice.finish_reason != null) {
      if (this.chunk_cache.length > 0) {
        const finalText = this.chunk_cache;
        pubsub.publish(`MESSAGE_STREAM`, {
          messageStream: {
            type: "COMPLETE_MESSAGE",
            id,
            text: this.chunk_cache,
            by: "AI",
            createdAt: initial_response_time.toString(),
          },
        });
        this.chunk_cache = "";
        return { finalText, hasContent: true, hasFunctionCalls: false };
      } else if (Object.keys(this.function_cache).length > 0) {
        return { finalText: "", hasContent: false, hasFunctionCalls: true };
      }
    }

    return { finalText: "", hasContent: false, hasFunctionCalls: false };
  }

  public getFunctionCache(): { [key: number]: FunctionCache } {
    return this.function_cache;
  }

  public clearFunctionCache(): void {
    this.function_cache = {};
  }
}
