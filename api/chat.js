
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = "asst_AuDZYQqTdkgS5cUMt2eHP1q0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responde requisições preflight (CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { message, fileContent } = req.body;
    
    // Create a more contextual message if file content is available
    const fullMessage = fileContent 
      ? `${message}\n\nContent from uploaded file:\n${fileContent}`
      : message;

    // Log the message length for debugging
    console.log(`Processing message with length: ${fullMessage.length}`);
    
    // Create a thread for the conversation
    const thread = await openai.beta.threads.create();
    
    // Add the user message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: fullMessage,
    });

    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Wait for the run to complete
    let completedRun;
    while (true) {
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (completedRun.status === "completed") break;
      if (completedRun.status === "failed") throw new Error("Falha ao gerar resposta.");
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const response = messages.data.find((msg) => msg.role === "assistant");

    // Return the response
    res.status(200).json({ reply: response?.content[0]?.text?.value || "Sem resposta." });
  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ error: "Erro ao processar sua solicitação." });
  }
}
