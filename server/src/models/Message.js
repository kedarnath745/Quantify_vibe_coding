import mongoose from "mongoose";
import { DEFAULT_TONE, TONE_IDS } from "../prompts/tones.js";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    tone: { type: String, enum: TONE_IDS, default: DEFAULT_TONE },
    // True when generation was stopped by the user or failed partway through.
    incomplete: { type: Boolean, default: false },
    // Suggested next questions, shown as chips under the latest reply.
    followUps: { type: [String], default: undefined },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
