// Variables the server cannot run without. Everything else in .env.example has a default.
const REQUIRED = {
  MONGODB_URI: "MongoDB connection string",
  GROQ_API_KEY: "Groq API key (https://console.groq.com/keys)",
  CHAT_MODEL: "model used for chat replies",
  UTILITY_MODEL: "model used for titles and follow-up questions",
};

/** Exits with a message naming every missing variable, instead of failing later on first use. */
export function validateEnv() {
  const missing = Object.keys(REQUIRED).filter((name) => !process.env[name]?.trim());
  if (missing.length === 0) return;

  console.error("Missing required environment variables in server/.env:");
  for (const name of missing) console.error(`  - ${name}: ${REQUIRED[name]}`);
  console.error("Copy server/.env.example to server/.env and fill in these values.");
  process.exit(1);
}
