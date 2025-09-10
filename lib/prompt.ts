export function buildPrompt(context: string, question: string) {
  return [
    {
      role: "system",
      content:
        "Tu es un assistant concis et factuel. Utilise UNIQUEMENT le contexte. Si l’info n’y est pas, dis-le. Cite les sources avec des marqueurs [[n]].",
    },
    {
      role: "user",
      content:
        `Contexte (extraits pertinents):\n${context}\n\nQuestion: ${question}\n\n` +
        "Réponds clairement, en citant [[n]] au bon endroit.",
    },
  ] as const;
}
