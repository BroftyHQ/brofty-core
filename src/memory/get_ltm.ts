import client from "../db/qdrant/client.js";

export default async function get_ltm({
  query,
}: {
  query: string;
}): Promise<{
  role: "system";
  content: string;
}[]> {
  return [];
}
