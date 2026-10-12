import mongoose from "mongoose";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not forward rejected promises to the error handler on its own.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;

  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Invalid id";
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  }

  if (status >= 500) {
    console.error(err);
    message = "Something went wrong";
  }

  if (res.headersSent) return res.end();
  res.status(status).json({ error: message });
}
