import { get_available_tools } from "./available_tools_manager.js";

export default async function get_openai_tool_schema() {
  const toolsJson = get_available_tools();
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

  for (const [name, tools] of Object.entries(toolsJson)) {
    if (!Array.isArray(tools)) continue;
    for (const tool of tools) {
      if (
        tool.name &&
        tool.description &&
        (tool.parameters || tool.inputSchema)
      ) {
        const params = cleanOpenAISchemaTypes(
          JSON.parse(JSON.stringify(tool.parameters || tool.inputSchema))
        );
        openaiTools.push({
          type: "function",
          name: `${name}___${tool.name}`,
          description: tool.description,
          parameters: params,
        });
      }
    }
  }

  return openaiTools;
}
