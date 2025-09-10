import "dotenv/config";
import { NextRequest, NextResponse } from "next/server";
import { Ollama } from "@langchain/ollama";
import { getVectorStore } from "@/lib/qdrant";
import { buildPrompt } from "@/lib/prompt";

const {
  OLLAMA_BASE_URL = "http://localhost:11434",
  OLLAMA_LLM_MODEL = "mistral:7b",
} = process.env;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { question, topK = 6 } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing 'question' string" },
        { status: 400 }
      );
    }

    // 1) Retrieve
    const store = await getVectorStore();
    const results = await store.similaritySearch(question, topK);

    const context = results
      .map(
        (d, i) =>
          `[[${i + 1}]] (source: ${d.metadata?.source ?? "unknown"})\n${
            d.pageContent
          }`
      )
      .join("\n\n");

    // 2) Prompt
    const messages = buildPrompt(context, question);

    // 3) Generate
    const llm = new Ollama({
      baseUrl: OLLAMA_BASE_URL,
      model: OLLAMA_LLM_MODEL,
    });
    const prompt = messages.map((m) => m.content).join("\n");
    const answer = await llm.invoke(prompt);

    return NextResponse.json({
      answer,
      references: results.map((d, i) => ({
        ref: i + 1,
        source: d.metadata?.source ?? "unknown",
      })),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
