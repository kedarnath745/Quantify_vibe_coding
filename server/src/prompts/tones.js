// Each tone adds a modifier to the system prompt, so the style is enforced server-side.
export const TONES = {
  professional: {
    label: "Professional",
    description: "Clear, precise and well-structured",
    prompt:
      "Tone: professional. Write in a clear, precise and courteous register. " +
      "Structure longer answers with headings or lists, avoid slang and filler, and stay objective.",
  },
  casual: {
    label: "Casual",
    description: "Friendly and conversational",
    prompt:
      "Tone: casual. Write in a warm, friendly, conversational way, like explaining to a friend. " +
      "Use plain everyday language and contractions; light humour is fine, but keep the answer accurate.",
  },
  concise: {
    label: "Concise",
    description: "Short, direct answers",
    prompt:
      "Tone: concise. Give the shortest answer that fully addresses the question. " +
      "Lead with the answer, skip preambles and recaps, and prefer a few bullet points over paragraphs.",
  },
};

export const DEFAULT_TONE = "professional";
export const TONE_IDS = Object.keys(TONES);

export const isValidTone = (tone) => Object.hasOwn(TONES, tone);

export const listTones = () =>
  TONE_IDS.map((id) => ({ id, label: TONES[id].label, description: TONES[id].description }));

export const tonePrompt = (tone) => TONES[tone]?.prompt ?? TONES[DEFAULT_TONE].prompt;
