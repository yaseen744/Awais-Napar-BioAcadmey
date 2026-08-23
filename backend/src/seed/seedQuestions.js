// Parses the "Biomolecules_Mock_Test.html" file (sir's original mock test) and
// loads all its MCQs into the database as sample/starter question bank data.
//
// Run with: npm run seed   (from the backend/ folder, after setting MONGO_URI in .env)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Question from "../models/Question.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, "data", "Biomolecules_Mock_Test.html");

function parseQuestions(html) {
  const questions = [];

  // Each question block: <div class="question" id="q-N" data-correct="X"> ... </div>
  const questionBlockRegex = /<div class="question" id="q-(\d+)" data-correct="(\d+)">([\s\S]*?)<\/div>\s*<\/div>/g;

  let match;
  while ((match = questionBlockRegex.exec(html)) !== null) {
    const correctIndex = parseInt(match[2], 10);
    const block = match[3];

    const textMatch = block.match(/<span class="qText">([\s\S]*?)<\/span>/);
    const sourceMatch = block.match(/<span class="qSource">([\s\S]*?)<\/span>/);

    if (!textMatch) continue;

    const text = decodeEntities(textMatch[1].trim());
    const source = sourceMatch ? decodeEntities(sourceMatch[1].replace(/[()]/g, "").trim()) : "";

    const options = [];
    const optRegex = /<span class="optText">([\s\S]*?)<\/span>/g;
    let optMatch;
    while ((optMatch = optRegex.exec(block)) !== null) {
      options.push(decodeEntities(optMatch[1].trim()));
    }

    if (options.length < 2) continue;

    questions.push({
      subject: "Biology",
      chapter: "Biomolecules",
      text,
      options,
      correctIndex,
      source,
      explanation: "",
    });
  }

  return questions;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function run() {
  if (!fs.existsSync(HTML_PATH)) {
    console.error("Could not find source file at", HTML_PATH);
    process.exit(1);
  }

  const html = fs.readFileSync(HTML_PATH, "utf-8");
  const questions = parseQuestions(html);

  if (questions.length === 0) {
    console.error("No questions parsed from the HTML file. Check the file format.");
    process.exit(1);
  }

  await connectDB();

  const existing = await Question.countDocuments({ chapter: "Biomolecules" });
  if (existing > 0) {
    console.log(`Skipping: ${existing} Biomolecules questions already in the database.`);
    console.log("Delete them first if you want to re-seed.");
    await mongoose.disconnect();
    return;
  }

  await Question.insertMany(questions);
  console.log(`Seeded ${questions.length} questions into the database.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
