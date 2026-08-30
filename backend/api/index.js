// Vercel serverless entry point. Vercel automatically turns any file in
// /api into a serverless function. This one wraps the same Express app used
// locally (src/app.js), and makes sure MongoDB is connected before each
// request is handled (connection itself is cached in src/config/db.js so it
// isn't re-opened on every warm invocation).
import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
