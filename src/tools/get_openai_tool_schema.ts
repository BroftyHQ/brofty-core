import { tools_model } from "../db/sqlite/models.js";
import { Op } from "sequelize";

export default async function get_openai_tool_schema({
  names,
}: {
  names: string[];
}) {
  const toolsJson = [];
  for await (const name of names) {
    let toolName = name;
    let mcp_server = null;
    if (name.includes("___")) {
      mcp_server = name.split("___")[0];
      toolName = name.split("___")[1];
    }
    let tool_schema;
    if (mcp_server) {
      
      tool_schema = await tools_model.findOne({
        where: {
          name: toolName,
          mcp_server: mcp_server,
        },
        attributes: ["defination", "mcp_server"],
      });
    } else {
      tool_schema = await tools_model.findOne({
        where: {
          name: toolName,
        },
        attributes: ["defination", "mcp_server"],
      });
    }
    if (!tool_schema) {
      console.warn(`Tool schema not found for: ${name}`);
      continue;
    }
    toolsJson.push(tool_schema);
  }
  let openaiTools = [];
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
    const mcp_server = tool.dataValues.mcp_server;
    const tool_def = tool.dataValues.defination;

    if (!tool_def.name || !tool_def.description) continue;
    const params = cleanOpenAISchemaTypes(
      JSON.parse(JSON.stringify(tool_def.parameters || tool_def.inputSchema))
    );

    openaiTools.push({
      type: "function",
      function: {
        name: `${mcp_server}___${tool_def.name}`,
        description: tool_def.description,
        parameters: params,
      },
    });
  }

  return openaiTools;
}
