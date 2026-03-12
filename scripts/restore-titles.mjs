#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const GOOD_COMMIT = "f02f8ba";
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

function extractTitle(raw) {
  if (!raw.startsWith("---\n")) return null;
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return null;
  const block = raw.slice(4, end);
  for (const line of block.split("\n")) {
    const m = /^title:\s*(.+)$/.exec(line);
    if (m) return m[1].replace(/^['"]|['"]$/g, "").trim();
  }
  return null;
}

function getOldContent(relPath) {
  try {
    return execSync(`git show ${GOOD_COMMIT}:${relPath}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function updateFrontmatter(raw, oldTitle, currentTitle) {
  if (!raw.startsWith("---\n")) return raw;
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return raw;

  const before = raw.slice(0, 4);
  const block = raw.slice(4, end);
  const after = raw.slice(end);

  const lines = block.split("\n");
  const updated = [];
  let titleFound = false;
  let seoTitleExists = false;

  for (const line of lines) {
    if (/^seoTitle:/i.test(line)) seoTitleExists = true;
    if (/^title:\s*/.test(line) && !titleFound) {
      titleFound = true;
      updated.push(`title: "${oldTitle}"`);
      if (!seoTitleExists) updated.push(`seoTitle: "${currentTitle}"`);
    } else {
      updated.push(line);
    }
  }

  return before + updated.join("\n") + after;
}

const files = walk(DOCS_DIR);
const stats = { total: 0, modified: 0, skipped: 0, errors: 0, notFound: 0 };

for (const file of files) {
  stats.total++;
  const relPath = path.relative(ROOT, file);
  const current = fs.readFileSync(file, "utf8");
  const currentTitle = extractTitle(current);

  if (!currentTitle) {
    console.log(`⚠️  ${relPath}: no current title`);
    stats.errors++;
    continue;
  }

  const oldContent = getOldContent(relPath);
  if (!oldContent) {
    console.log(`ℹ️  ${relPath}: not in ${GOOD_COMMIT}`);
    stats.notFound++;
    continue;
  }

  const oldTitle = extractTitle(oldContent);
  if (!oldTitle) {
    console.log(`⚠️  ${relPath}: no old title`);
    stats.errors++;
    continue;
  }

  if (oldTitle === currentTitle) {
    stats.skipped++;
    continue;
  }

  if (current.includes("seoTitle:")) {
    console.log(`⏭️  ${relPath}: already has seoTitle`);
    stats.skipped++;
    continue;
  }

  const updated = updateFrontmatter(current, oldTitle, currentTitle);
  fs.writeFileSync(file, updated, "utf8");
  console.log(`✅ ${relPath}: "${currentTitle}" → title="${oldTitle}" + seoTitle`);
  stats.modified++;
}

console.log("\n📊 Summary:");
console.log(`   Total: ${stats.total}`);
console.log(`   Modified: ${stats.modified}`);
console.log(`   Skipped: ${stats.skipped}`);
console.log(`   Not found in ${GOOD_COMMIT}: ${stats.notFound}`);
console.log(`   Errors: ${stats.errors}`);
