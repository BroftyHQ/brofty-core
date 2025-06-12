import OpenAI from "openai";

let cachedClient: OpenAI | undefined;
let lastInitTime: number | undefined;
const CLIENT_INVALIDATE_INTERVAL = 20 * 60 * 1000; // 20 minutes in ms

async function getOpenAIClient(token: string): Promise<OpenAI> {
  const now = Date.now();
  if (!cachedClient || !lastInitTime || (now - lastInitTime) > CLIENT_INVALIDATE_INTERVAL) {
    cachedClient = new OpenAI({
      baseURL: "http://localhost:1337/rest/v1/openai-proxy", // Use the local OpenAI server
      apiKey: token,
    });
    lastInitTime = now;
  }
  return cachedClient;
}

export default getOpenAIClient;
