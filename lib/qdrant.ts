import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { OllamaEmbeddings } from "@langchain/ollama";

const {
  QDRANT_URL = "http://localhost:6333",
  QDRANT_COLLECTION = "rag_docs",
  OLLAMA_BASE_URL = "http://localhost:11434",
  OLLAMA_EMBED_MODEL = "mxbai-embed-large",
} = process.env;

export async function getVectorStore() {
  const client = new QdrantClient({ url: QDRANT_URL });
  const embeddings = new OllamaEmbeddings({
    model: OLLAMA_EMBED_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });

  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    client,
    collectionName: QDRANT_COLLECTION,
  });
}
