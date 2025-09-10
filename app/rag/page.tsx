"use client";

import { useState } from "react";

export default function RagPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [refs, setRefs] = useState<{ ref: number; source: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function askRag() {
    if (!question) return;
    setLoading(true);
    setAnswer("");
    setRefs([]);

    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      if (data.error) {
        setAnswer("❌ Erreur: " + data.error);
      } else {
        setAnswer(data.answer || "");
        setRefs(data.references || []);
      }
    } catch (e: any) {
      setAnswer("❌ Erreur réseau: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test RAG local</h1>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Pose ta question..."
        className="w-full border rounded p-2 mb-4"
        rows={3}
      />

      <button
        onClick={askRag}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "⏳ Recherche..." : "Poser la question"}
      </button>

      {answer && (
        <div className="mt-6">
          <h2 className="font-semibold">Réponse :</h2>
          <p className="whitespace-pre-wrap mt-2">{answer}</p>
        </div>
      )}

      {refs.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold">Sources :</h2>
          <ul className="list-disc ml-6 mt-2">
            {refs.map((r) => (
              <li key={r.ref}>
                [[{r.ref}]] — {r.source}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
