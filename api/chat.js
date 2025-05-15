import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).setHeader("Access-Control-Allow-Origin", "*").setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS").setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization").end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Invalid messages format" });
      return;
    }

    const systemMessageContent = "You are a helpful assistant.";
    const openAIMessages = [
      { role: "system", content: systemMessageContent },
      ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: openAIMessages,
      stream: false,
    });

    const assistantResponse = completion.choices[0]?.message?.content;

    if (!assistantResponse) {
      res.status(500).json({ error: "Failed to get response from AI" });
      return;
    }

    res.status(200).json({ response: assistantResponse });

  } catch (e) {
    console.error("Error in chat handler (Text Only):", e);
    res.status(500).json({ error: "Failed to process message", details: e.message });
  }
}
