import { OpenAI } from "openai";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// REMOVED: export const config = { runtime: "edge", maxDuration: 60 };
// This will now default to Node.js runtime

export default async function handler(req, res) {
  console.log("API_CHAT_HANDLER_NODE: Request received");

  if (req.method === "OPTIONS") {
    console.log("API_CHAT_HANDLER_NODE: Handling OPTIONS request");
    res.status(200).setHeader("Access-Control-Allow-Origin", "*").setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS").setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization").end();
    return;
  }

  if (req.method !== "POST") {
    console.warn(`API_CHAT_HANDLER_NODE: Method not allowed: ${req.method}`);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // req.body should be automatically parsed by Vercel for Node.js functions if Content-Type is application/json
    const { messages, files } = req.body;
    console.log("API_CHAT_HANDLER_NODE: Request body parsed:", { messages, files });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.warn("API_CHAT_HANDLER_NODE: Invalid messages format or empty messages array");
      res.status(400).json({ error: "Invalid messages format" });
      return;
    }

    let systemMessageContent = "You are a helpful assistant.";
    if (files && files.length > 0) {
      systemMessageContent += "\n\nThe user has uploaded the following files (content provided if text-based):\n";
      files.forEach(file => {
        systemMessageContent += `\n- ${file.name}`;
        if (file.content && typeof file.content === "string") {
          systemMessageContent += `:\n---\n${file.content}\n---
`;
        }
      });
    }

    const openAIMessages = [
      { role: "system", content: systemMessageContent },
      ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
    ];

    console.log("API_CHAT_HANDLER_NODE: Sending request to OpenAI with messages:", JSON.stringify(openAIMessages, null, 2));

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: openAIMessages,
      stream: false,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    console.log("API_CHAT_HANDLER_NODE: Received response from OpenAI:", assistantResponse);

    if (!assistantResponse) {
      console.error("API_CHAT_HANDLER_NODE: OpenAI response was empty or malformed");
      res.status(500).json({ error: "Failed to get response from AI" });
      return;
    }

    res.status(200).json({ response: assistantResponse });

  } catch (e) {
    console.error("API_CHAT_HANDLER_NODE: Error in chat handler:", e);
    res.status(500).json({ error: "Failed to process message", details: e.message });
  }
}