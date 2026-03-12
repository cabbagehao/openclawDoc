#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const SKIP_DIRS = new Set(["assets", "images", ".i18n"]);
const DOC_EXT_RE = /\.(md|mdx)$/i;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (DOC_EXT_RE.test(entry.name)) out.push(full);
  }
  return out;
}

function updateFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return { updated: raw, changed: false };
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return { updated: raw, changed: false };

  const before = raw.slice(0, 4);
  const block = raw.slice(4, end);
  const after = raw.slice(end);

  const lines = block.split("\n");
  const updated = [];
  let currentTitle = null;
  let seoTitle = null;
  let titleLineIdx = -1;
  let seoTitleLineIdx = -1;

  // First pass: extract values
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const titleMatch = /^title:\s*"(.+)"$/.exec(line);
  const seoTitleMatch = /^seoTitle:\s*"(.+)"$/.exec(line);

    if (titleMatch) {
      currentTitle = titleMatch[1];
      titleLineIdx = i;
    } else if (seoTitleMatch) {
   seoTitle = seoTitleMatch[1];
      seoTitleLineIdx = i;
    }
  }

  // If no seoTitle, nothing to do
  if (!seoTitle) return { updated: raw, changed: false };

  // Second pass: rebuild with seoTitle as title
  for (let i = 0; i < lines.length; i++) {
    if (i === titleLineIdx) {
      updated.push(`title: "${seoTitle}"`);
    } else if (i === seoTitleLineIdx) {
      // Remove seoTitle line
      continue;
    } else {
      updated.push(lines[i]);
    }
  }

  return {
    updated: before + updated.join("\n") + after,
    changed: true,
    oldTitle: currentTitle,
    newTitle: seoTitle
  };
}

const files = walk(DOCS_DIR);
const stats = { total: 0, modified: 0, skipped: 0 };

for (const file of files) {
  stats.total++;
  const relPath = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, "utf8");
  const { updated, changed, oldTitle, newTitle } = updateFrontmatter(raw);

  if (!changed) {
    stats.skipped++;
    continue;
  }

  fs.writeFileSync(file, updated, "utf8");
  console.log(`✅ ${relPath}: title="${newTitle}"`);
  stats.modified++;
}

console.log("\n📊 Summary:");
console.log(`   Total: ${stats.total}`);
console.log(`   Modified: ${stats.modified}`);
console.log(`   Skipped (no seoTitle): ${stats.skipped}`);
