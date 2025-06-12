import { tools_model } from "../db/sqlite/models.js";

export default async function get_openai_tool_schema() {
  const toolsJson = await tools_model.findAll({
    attributes: ["defination", "mcp_server"],
  });

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
