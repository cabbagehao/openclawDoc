#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

async function walk(dir, results = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, results);
        continue;
      }
      if (/\.mdx?$/.test(entry.name)) results.push(fullPath);
    }
  } catch (err) {
    // Directory might not exist
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  let langId = "";
  let docsRoot = "docs";
  let sourceRoot = "origin_docs";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lang") langId = args[++i];
    if (args[i] === "--docs") docsRoot = args[++i];
    if (args[i] === "--source") sourceRoot = args[++i];
  }

  if (!langId) {
    throw new Error("Missing required argument: --lang <e.g., ko-KR>");
  }

  const resolvedDocsRoot = path.resolve(docsRoot);
  const resolvedSourceRoot = path.resolve(sourceRoot);
  const targetRoot = path.join(resolvedDocsRoot, langId);

  // Get source files (English base)
  const sourceFilesRaw = await walk(resolvedSourceRoot);
  const sourceDocs = sourceFilesRaw
    .map((file) => path.relative(resolvedSourceRoot, file).replace(/\\/g, "/"))
    // Remove extension for matching
    .filter(f => !f.includes('.i18n')).map((file) => file.replace(/\.mdx?$/, "")).map(f => f === 'security/README' ? 'security/index' : f)
    .sort();

  // Get target files (Translated docs)
  const targetFilesRaw = await walk(targetRoot);
  const targetDocs = targetFilesRaw
    .map((file) => path.relative(targetRoot, file).replace(/\\/g, "/"))
    .filter(f => !f.includes('.i18n')).map((file) => file.replace(/\.mdx?$/, "")).map(f => f === 'security/README' ? 'security/index' : f)
    .sort();

  const missing = sourceDocs.filter((file) => !targetDocs.includes(file));
  const extra = targetDocs.filter((file) => !sourceDocs.includes(file));

  const result = {
    language: langId,
    baseSource: sourceRoot,
    sourceCount: sourceDocs.length,
    targetCount: targetDocs.length,
    missingCount: missing.length,
    extraCount: extra.length,
    missingFiles: missing.map(f => `${f}.md(x)`),
    extraFiles: extra.map(f => `${f}.md(x)`),
  };

  console.log(JSON.stringify(result, null, 2));

  if (missing.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
