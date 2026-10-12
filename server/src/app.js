import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import conversationsRouter from "./routes/conversations.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { listTones } from "./prompts/tones.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({ status: "ok", db });
});

app.get("/api/config", (req, res) => {
  res.json({ maxMessageLength: Number(process.env.MAX_MESSAGE_LENGTH) || 4000 });
});

app.get("/api/tones", (req, res) => {
  res.json(listTones());
});

app.use("/api/conversations", conversationsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
