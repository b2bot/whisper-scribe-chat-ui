import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = "asst_AuDZYQqTdkgS5cUMt2eHP1q0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { message, fileContent } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Mensagem inválida." });
    }

    const finalContent = fileContent
      ? `${message}\n\nConteúdo extraído do arquivo:\n${fileContent}`
      : message;

    console.log(`[chat] Mensagem recebida (${finalContent.length} caracteres)`);

    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: finalContent,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    let completedRun;
    while (true) {
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (completedRun.status === "completed") break;
      if (completedRun.status === "failed") throw new Error("Falha na execução do assistente.");
      await new Promise((r) => setTimeout(r, 1000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const response = messages.data.find((msg) => msg.role === "assistant");

    const reply = response?.content?.[0]?.text?.value;

    if (!reply) {
      return res.status(200).json({ reply: "O assistente não retornou uma resposta." });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Erro no handler do chat:", error);
    return res.status(500).json({ error: "Erro ao processar a requisição do chat." });
  }
}
