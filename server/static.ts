import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getDirname(): string {
  try {
    if (typeof (import.meta as any).url === "string" && (import.meta as any).url) {
      return path.dirname(fileURLToPath((import.meta as any).url));
    }
  } catch {}
  if (typeof __dirname !== "undefined") return __dirname;
  return process.cwd();
}

const HERE = getDirname();

function resolvePublicDir(): string {
  const candidates = [
    path.resolve(HERE, "public"),
    path.resolve(HERE, "..", "dist", "public"),
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