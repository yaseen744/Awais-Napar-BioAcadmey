// Local development entry point only. On Vercel, api/index.js is used
// instead (Vercel runs the exported Express app as a serverless function
// and never executes this file).
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
