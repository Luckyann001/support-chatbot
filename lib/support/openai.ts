import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local before using AI routes.");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
