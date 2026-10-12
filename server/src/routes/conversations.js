import { Router } from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { asyncHandler, HttpError } from "../middleware/errors.js";
import { streamChat, generateTitle, generateFollowUps } from "../services/llm.js";
import { DEFAULT_TONE, TONE_IDS, isValidTone } from "../prompts/tones.js";
import { groupLabel, relativeTime } from "../utils/time.js";

const router = Router();

const DEFAULT_TITLE = "New chat";
const maxContextMessages = () => Number(process.env.MAX_CONTEXT_MESSAGES) || 20;
const maxMessageLength = () => Number(process.env.MAX_MESSAGE_LENGTH) || 4000;

/** Adds the display fields the client renders without doing any date maths. */
function present(conversation, messageCount, now = new Date()) {
  const c = typeof conversation.toObject === "function" ? conversation.toObject() : conversation;
  return {
    ...c,
    messageCount,
    group: groupLabel(c.updatedAt, now),
    relativeTime: relativeTime(c.updatedAt, now),
    startedTime: relativeTime(c.createdAt, now),
  };
}

const countMessages = (conversationId) => Message.countDocuments({ conversation: conversationId });

async function findConversation(id) {
  const conversation = await Conversation.findById(id);
  if (!conversation) throw new HttpError(404, "Conversation not found");
  return conversation;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find().sort({ updatedAt: -1 }).limit(200).lean();
    const counts = await Message.aggregate([
      { $match: { conversation: { $in: conversations.map((c) => c._id) } } },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.count]));
    const now = new Date();
    res.json(conversations.map((c) => present(c, countById.get(String(c._id)) ?? 0, now)));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.create({});
    res.status(201).json(present(conversation, 0));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const conversation = await findConversation(req.params.id);
    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    res.json({
      conversation: present(conversation, messages.length),
      messages,
      messageCount: messages.length,
    });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) throw new HttpError(400, "Title is required");
    if (title.length > 100) throw new HttpError(400, "Title must be 100 characters or fewer");

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true, runValidators: true }
    );
    if (!conversation) throw new HttpError(404, "Conversation not found");
    res.json(present(conversation, await countMessages(conversation._id)));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const conversation = await findConversation(req.params.id);
    await Message.deleteMany({ conversation: conversation._id });
    await conversation.deleteOne();
    res.status(204).end();
  })
);

/**
 * Sends `{ content, tone }` and streams the assistant reply as Server-Sent Events.
 * `tone` is optional (default "professional") and is applied as a system instruction.
 *   event: user   -> the saved user message
 *   event: delta  -> { text } chunk of the reply
 *   event: done   -> { message, conversation } saved reply (with followUps) and updated conversation
 *   event: error  -> { error } generation failed
 */
router.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) throw new HttpError(400, "Message content is required");
    if (content.length > maxMessageLength()) {
      throw new HttpError(400, `Message must be ${maxMessageLength()} characters or fewer`);
    }
    const tone = req.body.tone ?? DEFAULT_TONE;
    if (!isValidTone(tone)) {
      throw new HttpError(400, `Tone must be one of: ${TONE_IDS.join(", ")}`);
    }

    const conversation = await findConversation(req.params.id);
    const userMessage = await Message.create({
      conversation: conversation._id,
      role: "user",
      content,
      tone,
    });

    const recent = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .limit(maxContextMessages());
    const history = recent.reverse().map(({ role, content }) => ({ role, content }));

    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const send = (event, data) => {
      if (!res.writableEnded && !res.destroyed) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    // Stop generating if the client disconnects or presses Stop.
    const controller = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });

    send("user", userMessage);

    let reply = "";
    let failed = false;
    try {
      await streamChat(history, {
        tone,
        signal: controller.signal,
        onDelta: (text) => {
          reply += text;
          send("delta", { text });
        },
      });
    } catch (err) {
      failed = true;
      if (!controller.signal.aborted) {
        console.error("Chat generation failed:", err.message);
        if (err.status === 429) {
          send("error", {
            status: 429,
            error: "The model is receiving too many requests. Wait a moment and try again.",
          });
        } else {
          send("error", { error: "The assistant failed to respond. Please try again." });
        }
      }
    }
    // The SDK ends an aborted stream quietly instead of throwing, so check explicitly.
    if (controller.signal.aborted) failed = true;

    let assistantMessage = null;
    if (reply.trim()) {
      assistantMessage = await Message.create({
        conversation: conversation._id,
        role: "assistant",
        content: reply,
        tone,
        incomplete: failed,
      });
    }

    const update = { tone };
    if (assistantMessage && !failed) {
      const needsTitle = conversation.title === DEFAULT_TITLE;
      const [title, followUps] = await Promise.all([
        needsTitle
          ? generateTitle(content, reply).catch((err) => {
              console.error("Title generation failed:", err.message);
              return null;
            })
          : null,
        generateFollowUps(content, reply).catch((err) => {
          console.error("Follow-up generation failed:", err.message);
          return [];
        }),
      ]);
      if (title) update.title = title;
      if (followUps.length) {
        assistantMessage.followUps = followUps;
        await assistantMessage.save();
      }
    }
    // Always bump updatedAt so the conversation moves to the top of the list.
    const updated = await Conversation.findByIdAndUpdate(conversation._id, update, { new: true });

    send("done", {
      message: assistantMessage,
      // Null if the conversation was deleted while the reply was streaming.
      conversation: updated && present(updated, await countMessages(updated._id)),
    });
    res.end();
  })
);

export default router;
