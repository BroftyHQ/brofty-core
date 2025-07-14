import { Tool } from "../../prisma/generated/index.js";
import getPrisma from "../db/prisma/client.js";

export default async function get_openai_tool_schema({
  names,
}: {
  names: string[];
}) {
  const prisma = await getPrisma();
  const toolsJson: Tool[] = [];
  for await (const name of names) {
    let toolName = name;
    let mcp_server = null;
    if (name.includes("___")) {
      mcp_server = name.split("___")[0];
      toolName = name.split("___")[1];
    }
    let tool_schema;
    if (mcp_server) {
      tool_schema = await prisma.tool.findFirst({
        where: {
          name: toolName,
          mcpServer: mcp_server,
        },
        select: {
          defination: true,
          mcpServer: true,
        },
      });
    } else {
      tool_schema = await prisma.tool.findFirst({
        where: {
          name: toolName,
        },
        select: {
          defination: true,
          mcpServer: true,
        },
      });
    }
    if (!tool_schema) {
      console.warn(`Tool schema not found for: ${name}`);
      continue;
    }
    toolsJson.push(tool_schema);
  }
  let openaiTools = [];
  const addedToolNames = new Set();
  
  // Recursively remove any property where type is an array, and remove from required if present
  function cleanOpenAISchemaTypes(schema) {
    if (Array.isArray(schema)) {
      return schema.map(cleanOpenAISchemaTypes);
    } else if (schema && typeof schema === "object") {
      // Remove properties with type as array
      if (schema.properties && typeof schema.properties === "object") {
        for (const key of Object.keys(schema.properties)) {
          const prop = schema.properties[key];
          if (Array.isArray(prop.type)) {
            // Remove from required if present
            if (Array.isArray(schema.required)) {
              schema.required = schema.required.filter((r) => r !== key);
              if (schema.required.length === 0) delete schema.required;
            }
            // Remove the property
            delete schema.properties[key];
          } else {
            // Recurse
            schema.properties[key] = cleanOpenAISchemaTypes(prop);
          }
        }
      }
      // Recurse into items, allOf, anyOf, oneOf, etc.
      for (const key of ["items", "allOf", "anyOf", "oneOf"]) {
        if (schema[key]) {
          schema[key] = cleanOpenAISchemaTypes(schema[key]);
        }
      }
    }
    return schema;
  }

  for (const tool of toolsJson) {
    const mcpServer = tool.mcpServer;
    const toolDef = JSON.parse(tool.defination.toString() || "{}");

    if (!toolDef.name || !toolDef.description) continue;

    const toolName = `${mcpServer}___${toolDef.name}`;

    // Skip if tool is already added
    if (addedToolNames.has(toolName)) {
      continue;
    }
    
    const params = cleanOpenAISchemaTypes(
      JSON.parse(JSON.stringify(toolDef.parameters || toolDef.inputSchema))
    );

    openaiTools.push({
      type: "function",
      function: {
        name: toolName,
        description: toolDef.description,
        parameters: params,
      },
    });
    
    addedToolNames.add(toolName);
  }

  return openaiTools;
}
