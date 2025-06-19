import OpenAI from "openai";
import { BACKEND_URL } from "../common/constants.js";

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
    const host = `${BACKEND_URL}/rest/v1/openai-proxy`;
    cachedClient = new OpenAI({
      baseURL: host,
      apiKey: token,
    });
    lastInitTime = now;
  }
  return cachedClient;
}

export default getOpenAIClient;
