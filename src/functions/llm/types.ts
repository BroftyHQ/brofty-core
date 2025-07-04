export type FunctionCache = {
  name: string;
  tool_call_id: string;
  arguments: string;
};

export type ToolCall = {
  role: "tool";
  tool_call_id: string;
  content: string;
  name: string;
  arguments: string;
};

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  content:
    | string
    | {
        type: string;
        text?: string;
        image_url?: string;
      };
};

export type GenerateResponseParams = {
  id: string;
  user_token: string;
  user_query: string;
  user_messages: Message[];
  initial_response_time: string;
  tool_calls?: ToolCall[];
  recursion_count?: number;
  functions_suggestions?: string[];
};
