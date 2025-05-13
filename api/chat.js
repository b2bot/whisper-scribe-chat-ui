
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = "asst_AuDZYQqTdkgS5cUMt2eHP1q0";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight (CORS) requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Chat API request received");
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      console.error("Invalid message format", message);
      return res.status(400).json({ error: "Invalid message format. Message is required and must be a string." });
    }

    console.log("Creating thread");
    const thread = await openai.beta.threads.create();
    
    console.log("Adding message to thread", thread.id);
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    console.log("Creating run with assistant", ASSISTANT_ID);
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    console.log("Run created", run.id);
    let completedRun;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("Run status:", completedRun.status);
      
      if (completedRun.status === "completed") break;
      if (completedRun.status === "failed" || completedRun.status === "cancelled" || completedRun.status === "expired") {
        throw new Error(`Run failed with status: ${completedRun.status}`);
      }
      
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Request timed out waiting for response");
    }

    console.log("Getting messages from thread");
    const messages = await openai.beta.threads.messages.list(thread.id);
    const response = messages.data.find((msg) => msg.role === "assistant");

    if (!response || !response.content || !response.content[0] || !response.content[0].text) {
      throw new Error("No valid response received from assistant");
    }

    const reply = response.content[0].text.value;
    console.log("Reply received, length:", reply.length);
    
    res.status(200).json({ reply });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Error processing your request.", 
      details: error.message 
    });
  }
}
