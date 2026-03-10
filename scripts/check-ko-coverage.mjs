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
  const english = (await walk(docsRoot))
    .filter((file) => !file.startsWith(path.join(docsRoot, "zh-CN")) && !file.startsWith(path.join(docsRoot, "ja-JP")) && !file.startsWith(path.join(docsRoot, "ko-KR")))
    .map((file) => path.relative(docsRoot, file).replace(/\\/g, "/"))
    .sort();
  const koreanRoot = path.join(docsRoot, "ko-KR");
  const korean = (await walk(koreanRoot).catch(() => [])).map((file) => path.relative(koreanRoot, file).replace(/\\/g, "/")).sort();

  const missing = english.filter((file) => !korean.includes(file));
  const extra = korean.filter((file) => !english.includes(file));
  const result = {
    english: english.length,
    korean: korean.length,
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