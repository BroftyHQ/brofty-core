import { DateTime } from "luxon";
import { getPreference, setPreference } from "../user_preferences/index.js";
import fs from "fs";
import { tools_model } from "../db/sqlite/models.js";
import logger from "../common/logger.js";

export default async function user_initialization(): Promise<void> {
  const is_initialized = await getPreference("is_initialized");
  if (is_initialized) {
    // User is already initialized, no action needed
    logger.info("User is already initialized, skipping initialization.");
    return;
  }
  // set initialization flag as current timestamp
  await setPreference("is_initialized", DateTime.now().toMillis().toString());

  // create default tools

  // read from ../tools/default_tools.json
  const defaultToolsPath = new URL(
    "../tools/default_tools.json",
    import.meta.url
  );
  const defaultTools = JSON.parse(fs.readFileSync(defaultToolsPath, "utf-8"));

  // create tool for each tool in default_tools.json
  for (const tool of defaultTools) {
    await tools_model.findOrCreate({
      where: {
        name: tool.name,
      },
      defaults: {
        name: tool.name,
        description: tool.description,
        defination: tool,
        mcp_server: "local",
      },
    });
  }
}
