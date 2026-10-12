import Groq from "groq-sdk";
import { tonePrompt } from "../prompts/tones.js";

const SYSTEM_PROMPT =
  "You are a helpful, knowledgeable AI assistant. Answer clearly and concisely. " +
  "Use Markdown for formatting, and fenced code blocks with a language tag for code.";

let client;
function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

/**
 * Streams a chat completion in the given tone. Calls onDelta for each text
 * chunk and resolves with the full reply text.
 */
export async function streamChat(history, { tone, onDelta, signal }) {
  const stream = await getClient().chat.completions.create(
    {
      model: process.env.CHAT_MODEL,
      messages: [{ role: "system", content: `${SYSTEM_PROMPT}\n\n${tonePrompt(tone)}` }, ...history],
      stream: true,
    },
    { signal }
  );

  let text = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      text += delta;
      onDelta(delta);
    }
  }
  return text;
}

/** Generates a short conversation title from the first exchange. */
export async function generateTitle(userText, assistantText) {
  const completion = await getClient().chat.completions.create({
    model: process.env.UTILITY_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Write a short title (max 6 words) for this conversation. " +
          "Reply with the title only: no quotes, no trailing punctuation.",
      },
      {
        role: "user",
        content: `User: ${userText.slice(0, 1000)}\n\nAssistant: ${assistantText.slice(0, 1000)}`,
      },
    ],
    max_completion_tokens: 300,
  });

  const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["'.]$/g, "");
  return title ? title.slice(0, 100) : null;
}

/** Suggests up to three short follow-up questions the user might ask next. */
export async function generateFollowUps(userText, assistantText) {
  const completion = await getClient().chat.completions.create({
    model: process.env.UTILITY_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Suggest 3 short follow-up questions the user is likely to ask next, written from the user's " +
          "point of view (max 12 words each). Reply with one question per line and nothing else: " +
          "no numbering, bullets or quotes.",
      },
      {
        role: "user",
        content: `User: ${userText.slice(0, 1500)}\n\nAssistant: ${assistantText.slice(0, 3000)}`,
      },
    ],
    max_completion_tokens: 600,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const questions = text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter((line) => line.length > 3 && line.length <= 150);
  // Deduplicated because the client uses each question as a React key.
  return [...new Set(questions)].slice(0, 3);
}
