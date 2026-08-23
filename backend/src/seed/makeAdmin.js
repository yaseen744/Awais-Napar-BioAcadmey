// Promotes an already-registered user to "admin" so they can add
// questions, videos, and notes.
//
// Run with: node src/seed/makeAdmin.js someone@example.com

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node src/seed/makeAdmin.js <email>");
  process.exit(1);
}

async function run() {
  await connectDB();

  // Promoting to admin also auto-approves the account, otherwise the new
  // admin would be locked out by their own approval requirement.
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin", isApproved: true },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email ${email}. They must register first.`);
  } else {
    console.log(`${user.name} (${user.email}) is now an admin.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
