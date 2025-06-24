import { nanoid } from "nanoid";
import qdrant_client from "./db/qdrant/client.js";
import getOpenAIClient from "./llms/openai.js";

const memories = [
  {
    id: 1,
    text: "Remember the time we went hiking in the mountains?",
  },
  {
    id: 2,
    text: "I will never forget our trip to the beach last summer.",
  },
  {
    id: 3,
    text: "I can't believe how much we've grown over the years.",
  },
];

async function addMemoriesToQdrant() {
  // Ensure the collection exists
  let collection;
  try {
    collection = await qdrant_client.getCollection("memories");
  } catch (error) {
    console.error("Error fetching collection 'memories':", error.message);
  }
  if (!collection) {
    await qdrant_client.createCollection("memories", {
      vectors: {
        size: 1536, // Size for text-embedding-ada-002
        distance: "Cosine", // Use cosine distance for similarity
        on_disk: true,
      },
    });
    console.log("Collection 'memories' created.");
  } else {
    console.log("Collection 'memories' already exists.");
  }

  const openaiClient = await getOpenAIClient("test1337");

  const res: any = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    // @ts-ignore
    input: memories.map((memory) => ({
      id: memory.id.toString(),
      text: memory.text,
    })),
    // input: memories[0].text,
  });

  qdrant_client
    .upsert("memories", {
      points: res.embeddings.map((vector) => ({
        id: parseInt(vector.id),
        vector: vector.embedding,
        payload: memories.find((m) => m.id === parseInt(vector.id)) || {},
      })),
    })
    .then(() => {
      console.log("Memories upserted successfully.");
    })
    .catch((error) => {
      console.error("Error upserting memories:", error);
    });
}

async function searchMemories(query) {
  const openaiClient = await getOpenAIClient("test1337");
  const response: any = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  const search_results = await qdrant_client.search("memories", {
    vector: response.embedding,
    with_payload: true,
    limit: 3,
  });

  console.log("Search results:", search_results);
}

(async () => {
  await addMemoriesToQdrant();
  // await searchMemories("grow up");
})();
