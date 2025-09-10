import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import path from "node:path";

type Args = { source: string | null; collection: string; dryRun: boolean };

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let source: string | null = null;
  let collection = process.env.QDRANT_COLLECTION || "rag_docs";
  let dryRun = false;

  for (const arg of argv) {
    if (arg.startsWith("--collection="))
      collection = arg.split("=")[1] || collection;
    else if (arg === "--dry-run") dryRun = true;
    else if (!source) source = arg;
  }
  return { source, collection, dryRun };
}

// Normalisation pour comparer les noms de fichiers
const norm = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/\u2019/g, "'")
    .trim()
    .toLowerCase();

async function main() {
  const { source, collection, dryRun } = parseArgs();
  if (!source) {
    console.error("❌ Argument manquant: <source> (ex: MonDoc.pdf)");
    process.exit(1);
  }
  const url = process.env.QDRANT_URL || "http://localhost:6333";
  const client = new QdrantClient({ url });

  // Vérifier collection
  await client.getCollection(collection).catch(() => {
    console.error(`❌ Collection introuvable: "${collection}"`);
    process.exit(1);
  });

  // Fallback
  const want = norm(path.basename(source));
  let offset: any = undefined;
  const ids: (string | number)[] = [];
  let scanned = 0;

  for (;;) {
    const r = await client.scroll(collection, {
      limit: 512,
      with_payload: true,
      with_vector: false,
      offset,
    });
    for (const p of r.points ?? []) {
      scanned++;
      const pl: any = p.payload ?? {};
      const src = pl?.metadata?.source ?? pl?.source ?? "";
      if (src && norm(path.basename(String(src))) === want) {
        ids.push(p.id as any);
      }
    }
    if (!r.next_page_offset) break;
    offset = r.next_page_offset;
  }

  if (ids.length === 0) {
    console.log(
      `ℹ️ Aucun point trouvé pour "${source}" (normalisé=${want}), ${scanned} points scannés.`
    );
    process.exit(0);
  }

  console.log(`🔎 ${ids.length} points trouvés pour "${source}" (normalisé).`);

  if (dryRun) {
    console.log("🧪 --dry-run: aucune suppression effectuée.");
    process.exit(0);
  }

  await client.delete(collection, { wait: true, points: ids });
  console.log(`✅ Suppression OK. ${ids.length} points retirés.`);
}

main().catch((e) => {
  console.error("❌ Erreur:", e?.message || e);
  process.exit(1);
});
