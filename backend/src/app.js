import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import testRoutes from "./routes/testRoutes.js";

dotenv.config();

const app = express();

// In local development, Vite may pick a different port (5174, 5175, ...) if
// the default 5173 is already in use by another running instance. Rather
// than hard-locking CORS to one exact origin and silently breaking every
// request when that happens, allow any localhost/127.0.0.1 port during dev,
// plus whatever CLIENT_URL is explicitly set to (used in production).
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

// Trailing slashes are a common copy-paste mistake when setting CLIENT_URL on
// Vercel -- normalize both sides so "https://x.com" and "https://x.com/" are
// treated as the same origin instead of silently failing CORS.
const normalizeOrigin = (url) => (url || "").trim().replace(/\/+$/, "");
// CLIENT_URL can be a single URL or a comma-separated list (e.g. a
// production domain plus a Vercel preview URL) for a bit of flexibility.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser requests (curl, server-to-server) send no origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && isLocalOrigin(origin)) {
        return callback(null, true);
      }
      // Deny without throwing -- an Error here would 500 the whole request
      // (including the preflight OPTIONS), which just hides the real CORS
      // rejection behind a confusing "Internal Server Error". Cleanly
      // declining just omits the CORS headers, which is what should happen.
      console.warn(`CORS: rejected origin "${origin}" (allowed: ${allowedOrigins.join(", ") || "none set"})`);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/tests", testRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error." });
});

export default app;
