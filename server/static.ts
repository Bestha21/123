import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePublicDir(): string {
  const candidates = [
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `Could not find the build directory. Tried:\n${candidates.join("\n")}\nRun \`npm run build\` first.`,
  );
}

export function serveStatic(app: Express) {
  const distPath = resolvePublicDir();
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}