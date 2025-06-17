import OpenAI from "openai";
import { IS_PRODUCTION } from "../common/constants.js";
import logger from "../common/logger.js";

let cachedClient: OpenAI | undefined;
let lastInitTime: number | undefined;
const CLIENT_INVALIDATE_INTERVAL = 20 * 60 * 1000; // 20 minutes in ms

async function getOpenAIClient(token: string): Promise<OpenAI> {
  const now = Date.now();
  if (
    !cachedClient ||
    !lastInitTime ||
    now - lastInitTime > CLIENT_INVALIDATE_INTERVAL
  ) {
    const host = IS_PRODUCTION
        ? "https://backend.brofty.com/rest/v1/openai-proxy"
        : "http://localhost:1337/rest/v1/openai-proxy";
    logger.info(`Initializing OpenAI client with host: ${host}`);
    cachedClient = new OpenAI({
      baseURL: host,
      apiKey: token,
    });
    lastInitTime = now;
  }
  return cachedClient;
}

export default getOpenAIClient;
