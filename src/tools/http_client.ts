import OpenAI from "openai";

interface HttpClientParams {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: string;
  body: string;
  timeout: number;
}

async function http_client({
  url,
  method = "GET",
  headers = "{}",
  body,
  timeout = 10000,
}: HttpClientParams) {
  console.log(`Calling HTTP endpoint ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let supplied_headers = {};
    try {
      supplied_headers = JSON.parse(headers);
    } catch (error) {
      throw new Error("Error while parsing headers");
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...supplied_headers,
      },
      signal: controller.signal,
    };

    if (body && (method === "POST" || method === "PUT")) {
      fetchOptions.body =
        typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      success: response.ok,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        error: `Request timeout after ${timeout}ms`,
        success: false,
      };
    }
    return {
      error: `HTTP request failed: ${err.message}`,
      success: false,
    };
  }
}

const http_client_def: OpenAI.Responses.Tool = {
  type: "function",
  name: "http_client",
  description:
    "Make HTTP requests (GET, POST, PUT, DELETE) to external APIs and websites.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description:
          "The URL to make the request to. Must include protocol (http:// or https://)",
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE"],
        description: "HTTP method to use. Defaults to GET",
      },
      headers: {
        type: "string",
        description:
          `Additional headers to send with the request in string format. In key value pair object. Defaults to {} (empty object). Example is "{"Content-Type":"application/json"}"`,
      },
      body: {
        type: "string",
        description:
          "Request body for POST/PUT requests. Can be a JSON object in a string format, Request body as a JSON object (will be automatically stringified). Defaults to {} (empty object)",
      },
      timeout: {
        type: "number",
        description:
          "Request timeout in milliseconds. Defaults to 10000 (10 seconds)",
      },
    },
    required: ["url", "method", "headers", "body", "timeout"],
    additionalProperties: false,
  },
  strict: true,
};

export { http_client, http_client_def };
