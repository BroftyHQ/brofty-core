import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant_client = new QdrantClient({ host: "localhost", port: 6333 });

export default qdrant_client;