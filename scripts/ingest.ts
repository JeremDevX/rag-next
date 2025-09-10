import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pdfParse from "pdf-parse";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

const {
  QDRANT_URL = "http://localhost:6333",
  QDRANT_COLLECTION = "rag_docs",
  OLLAMA_BASE_URL = "http://localhost:11434",
  OLLAMA_EMBED_MODEL = "nomic-embed-text:v1.5",
} = process.env;

const DATA_DIR = path.resolve(process.cwd(), "rag-data");

async function loadDocs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  const files = fs.readdirSync(DATA_DIR);
  const docs: Document[] = [];

  for (const f of files) {
    const full = path.join(DATA_DIR, f);
    const ext = path.extname(f).toLowerCase();

    if (ext === ".pdf") {
      const buff = fs.readFileSync(full);
      const pdf = await pdfParse(buff);
      docs.push(
        new Document({ pageContent: pdf.text, metadata: { source: f } })
      );
    } else if ([".txt", ".md", ".html"].includes(ext)) {
      const raw = fs.readFileSync(full, "utf8");
      docs.push(new Document({ pageContent: raw, metadata: { source: f } }));
    } else {
      console.warn(`Skip (unsupported): ${f}`);
    }
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });

  return splitter.splitDocuments(docs);
}

async function main() {
  const chunks = await loadDocs();
  if (!chunks.length) {
    console.log(
      "Aucun document. Ajoute des fichiers dans ./rag-data puis relance."
    );
    return;
  }

  const client = new QdrantClient({ url: QDRANT_URL });
  const embeddings = new OllamaEmbeddings({
    model: OLLAMA_EMBED_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });

  await QdrantVectorStore.fromDocuments(chunks, embeddings, {
    client,
    collectionName: QDRANT_COLLECTION,
  });

  console.log(
    `Ingestion OK — ${chunks.length} chunks indexés dans "${QDRANT_COLLECTION}".`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
