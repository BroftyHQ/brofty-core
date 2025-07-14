import path from "path";
import { pathToFileURL } from "url";
import { PrismaClient } from "../../../prisma/generated/index.js";

// Cache for the Prisma client instance
let cachedPrismaClient: PrismaClient | null = null;

// Conditional import based on environment
async function getPrisma(): Promise<PrismaClient> {
  // Return cached client if already initialized
  if (cachedPrismaClient) {
    return cachedPrismaClient;
  }

  const prismaPath = path.join(process.cwd(), "prisma", "generated", "index.js");
  
  // Convert the path to a proper file:// URL for ESM import
  const prismaUrl = pathToFileURL(prismaPath).href;
  const { PrismaClient } = await import(prismaUrl);
  cachedPrismaClient = new PrismaClient();
  return cachedPrismaClient;
}

export default getPrisma;
