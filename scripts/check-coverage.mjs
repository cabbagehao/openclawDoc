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
  const args = process.argv.slice(2);
  let langId = "";
  let docsRoot = "docs";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lang") langId = args[++i];
    if (args[i] === "--docs") docsRoot = args[++i];
  }

  if (!langId) {
    throw new Error("Missing required argument: --lang <e.g., ko-KR>");
  }

  const resolvedDocsRoot = path.resolve(docsRoot);
  const isLocaleDir = (name) => /^[a-z]{2}-[A-Z]{2}$/.test(name);
  
  const allFiles = await walk(resolvedDocsRoot);
  
  const sourceDocs = allFiles
    .filter((file) => {
      const rel = path.relative(resolvedDocsRoot, file).replace(/\\/g, "/");
      const parts = rel.split("/");
      const top = parts[0];
      // Skip locale directories, translation assets, and static asset directories.
      return !isLocaleDir(top) && !parts.includes(".i18n") && top !== "images" && top !== "assets";
    })
    .map((file) => path.relative(resolvedDocsRoot, file).replace(/\\/g, "/"))
    .sort();

  const targetRoot = path.join(resolvedDocsRoot, langId);
  let targetFiles = [];
  try {
      targetFiles = await walk(targetRoot);
  } catch (err) {
      console.warn(`Warning: Target directory ${targetRoot} does not exist yet.`);
  }

  const target = targetFiles
    .map((file) => path.relative(targetRoot, file).replace(/\\/g, "/"))
    .filter((file) => !file.split("/").includes(".i18n"))
    .sort();

  const missing = sourceDocs.filter((file) => !target.includes(file));
  const extra = target.filter((file) => !sourceDocs.includes(file));

  const result = {
    language: langId,
    sourceCount: sourceDocs.length,
    targetCount: target.length,
    missingCount: missing.length,
    extraCount: extra.length,
    missingFiles: missing,
    extraFiles: extra,
  };

  console.log(JSON.stringify(result, null, 2));

  if (missing.length || extra.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
