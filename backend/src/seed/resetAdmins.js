// Deletes every user account currently marked role: "admin".
// Use this when test/throwaway admin accounts need to be cleared out before
// setting up the real admin (e.g. the teacher's own email).
//
// This does NOT touch students, questions, tests, videos, or past attempts --
// only admin-role user accounts are removed.
//
// Run with: node src/seed/resetAdmins.js --confirm
// (running without --confirm just lists what WOULD be deleted, as a safety check)

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const confirmed = process.argv.includes("--confirm");

async function run() {
  await connectDB();

  const admins = await User.find({ role: "admin" }).select("name email createdAt");

  if (admins.length === 0) {
    console.log("No admin accounts found -- nothing to delete.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${admins.length} admin account(s):\n`);
  admins.forEach((a) => console.log(`- ${a.name} <${a.email}>`));

  if (!confirmed) {
    console.log(
      "\nThis was a dry run -- no accounts were deleted. Re-run with --confirm to actually delete them:\n" +
        "  node src/seed/resetAdmins.js --confirm"
    );
    await mongoose.disconnect();
    return;
  }

  const result = await User.deleteMany({ role: "admin" });
  console.log(`\nDeleted ${result.deletedCount} admin account(s).`);
  console.log(
    "Next: register a new account through the app with the real admin's email, " +
      "then run:\n  node src/seed/makeAdmin.js <that-email>"
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
