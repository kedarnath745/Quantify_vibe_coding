import mongoose from "mongoose";
import { DEFAULT_TONE, TONE_IDS } from "../prompts/tones.js";

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "New chat", trim: true, maxlength: 100 },
    // Tone of the most recent message, used to preselect the toggle when reopening.
    tone: { type: String, enum: TONE_IDS, default: DEFAULT_TONE },
  },
  { timestamps: true }
);

conversationSchema.index({ updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
