// scripts/debug-payload.ts
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const url = process.env.QDRANT_URL || "http://localhost:6333";
const collection = process.env.QDRANT_COLLECTION || "rag_docs";

(async () => {
  const client = new QdrantClient({ url });
  const r = await client.scroll(collection, {
    limit: 5,
    with_payload: true,
    with_vector: false,
  });

  for (const p of r.points ?? []) {
    console.log("ID:", p.id);
    console.log("PAYLOAD:", JSON.stringify(p.payload, null, 2));
    console.log("---");
  }
})();
