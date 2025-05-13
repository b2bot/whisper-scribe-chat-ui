
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = "asst_AuDZYQqTdkgS5cUMt2eHP1q0";

export default async function handler(req, res) {
  // Always set content type to ensure proper JSON response
  res.setHeader("Content-Type", "application/json");
  
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, fileContent } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Invalid message" });
    }

    const finalContent = fileContent
      ? `${message}\n\nContent from uploaded file:\n${fileContent}`
      : message;

    console.log(`[chat] Received message (${finalContent.length} characters)`);

    try {
      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: finalContent,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
      });

      let completedRun;
      let retryCount = 0;
      const maxRetries = 10;
      
      // Poll for completion with timeout
      while (retryCount < maxRetries) {
        completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        if (completedRun.status === "completed") break;
        
        if (completedRun.status === "failed" || completedRun.status === "expired") {
          throw new Error(`Assistant run ${completedRun.status}: ${completedRun.last_error?.message || 'Unknown error'}`);
        }
        
        // Wait before checking again
        await new Promise((r) => setTimeout(r, 1000));
        retryCount++;
      }
      
      if (retryCount >= maxRetries) {
        throw new Error("Assistant response timed out");
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const response = messages.data.find((msg) => msg.role === "assistant");

      const reply = response?.content?.[0]?.text?.value;

      if (!reply) {
        return res.status(200).json({ reply: "The assistant did not return a response." });
      }

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("OpenAI API error:", error);
      return res.status(500).json({ error: "Error processing request with OpenAI" });
    }
  } catch (error) {
    console.error("General error in chat handler:", error);
    return res.status(500).json({ error: "Error processing chat request" });
  }
}
