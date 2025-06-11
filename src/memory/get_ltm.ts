import client from "../db/qdrant/client.js";

export default async function get_ltm({
  query,
}: {
  query: string;
}): Promise<string> {
  const ltm = await client.query("memory", {
    query: query,
    limit: 10,
    
  });

  return ltm.points.map((point) => point.payload).join("\n\n");
}
