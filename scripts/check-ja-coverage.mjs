#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

async function walk(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, results);
      continue;
    }
    if (/\.mdx?$/.test(entry.name)) results.push(fullPath);
  }
  return results;
}

async function main() {
  const docsRoot = path.resolve(process.argv[2] || "docs");
  const isLocaleDir = (name) => /^[a-z]{2}-[A-Z]{2}$/.test(name);
  const english = (await walk(docsRoot))
    .filter((file) => {
      const rel = path.relative(docsRoot, file).replace(/\\/g, "/");
      const parts = rel.split("/");
      const top = parts[0];
      return !isLocaleDir(top) && !parts.includes(".i18n") && top !== "images" && top !== "assets";
    })
    .map((file) => path.relative(docsRoot, file).replace(/\\/g, "/"))
    .sort();
  const japaneseRoot = path.join(docsRoot, "ja-JP");
  const japanese = (await walk(japaneseRoot))
    .map((file) => path.relative(japaneseRoot, file).replace(/\\/g, "/"))
    .filter((file) => !file.split("/").includes(".i18n"))
    .sort();

  const missing = english.filter((file) => !japanese.includes(file));
  const extra = japanese.filter((file) => !english.includes(file));
  const result = {
    english: english.length,
    japanese: japanese.length,
    missing: missing.length,
    extra: extra.length,
    missingFiles: missing,
    extraFiles: extra,
  };
  console.log(JSON.stringify(result, null, 2));
  if (missing.length || extra.length) process.exit(1);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
