import { getDocumentProxy, extractText } from "unpdf";

// Extracts plain text from a PDF buffer.
//
// Uses "unpdf" instead of "pdf-parse" on purpose: pdf-parse pulls in
// pdfjs-dist's Node/legacy build, which tries to load a native "@napi-rs/canvas"
// package at import time. That native package isn't available in Vercel's
// serverless environment, which crashed EVERY route on cold start (not just
// the PDF-import feature). "unpdf" bundles a PDF.js build made specifically
// for serverless/edge runtimes and never touches canvas for plain text
// extraction, so it's safe here.
export async function extractTextFromPdfBuffer(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text || "";
}
