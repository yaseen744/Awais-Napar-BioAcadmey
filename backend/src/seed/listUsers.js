// Quick diagnostic: lists every registered user with their exact email.
// Run with: node src/seed/listUsers.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

async function run() {
  await connectDB();
  const users = await User.find({}).select("name email role isApproved createdAt");

  if (users.length === 0) {
    console.log("No users found in the database at all.");
  } else {
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((u) => {
      console.log(
        `- name: "${u.name}" | email: "${u.email}" | role: ${u.role} | approved: ${u.isApproved}`
      );
    });
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
