const default_tools = [
  {
    "type": "function",
    "name": "calculate_expression",
    "description": "Evaluate a math expression and return the result.",
    "parameters": {
      "type": "object",
      "properties": {
        "expression": {
          "type": "string",
          "description": "Math.js-compatible expression. E.g. 'sqrt(25 + 5^2)'"
        }
      },
      "required": ["expression"],
      "additionalProperties": false
    },
    "strict": true
  },
  {
    "type": "function",
    "name": "http_client",
    "description": "Make HTTP requests (GET, POST, PUT, DELETE) to external APIs and websites.",
    "parameters": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "description": "The URL to make the request to. Must include protocol (http:// or https://)"
        },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "DELETE"],
          "description": "HTTP method to use. Defaults to GET"
        },
        "headers": {
          "type": "string",
          "description": "Additional headers to send with the request in string format. In key value pair object. Defaults to {} (empty object). Example is {'Content-Type':'application/json'}"
        },
        "body": {
          "type": "string",
          "description": "Request body for POST/PUT requests. Can be a JSON object in a string format, Request body as a JSON object (will be automatically stringified). Defaults to {} (empty object)"
        },
        "timeout": {
          "type": "number",
          "description": "Request timeout in milliseconds. Defaults to 10000 (10 seconds)"
        }
      },
      "required": ["url", "method", "headers", "body", "timeout"],
      "additionalProperties": false
    },
    "strict": true
  }
]

export default default_tools;
