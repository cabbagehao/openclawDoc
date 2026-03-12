#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const SKIP_DIRS = new Set(["assets", "images", ".i18n"]);
const DOC_EXT_RE = /\.(md|mdx)$/i;
const TITLE_MIN = 50;
const TITLE_MAX = 60;

function walkDocs(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDocs(path.join(dir, entry.name), out);
      continue;
    }

    if (DOC_EXT_RE.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
}

function parseFrontmatter(raw, relPath) {
  if (!raw.startsWith("---\n")) {
    return { error: `${relPath}: missing frontmatter`, data: {} };
  }

  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    return { error: `${relPath}: unterminated frontmatter`, data: {} };
  }

  const block = raw.slice(4, end);
  const data = {};
  for (const line of block.split("\n")) {
    const match = /^([A-Za-z0-9:_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, value] = match;
    const normalized = value.replace(/^['"]|['"]$/g, "").trim();
    data[key] = normalized;
  }

  return { data };
}

const files = [];
walkDocs(DOCS_DIR, files);

const missingTitle = [];
const missingDescription = [];
const shortTitles = [];
const longTitles = [];
const duplicateTitles = new Map();
const parseErrors = [];

for (const file of files) {
  const relPath = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, "utf8");
  const { data, error } = parseFrontmatter(raw, relPath);
  if (error) {
    parseErrors.push(error);
    continue;
  }

  const title = data.title ?? "";
  const description = data.description ?? "";

  if (!title) {
    missingTitle.push(relPath);
  } else {
    const length = [...title].length;
    if (length < TITLE_MIN) shortTitles.push({ path: relPath, title, length });
    if (length > TITLE_MAX) longTitles.push({ path: relPath, title, length });
    if (!duplicateTitles.has(title)) duplicateTitles.set(title, []);
    duplicateTitles.get(title).push(relPath);
  }

  if (!description) {
    missingDescription.push(relPath);
  }
}

const duplicateTitleEntries = [...duplicateTitles.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([title, paths]) => ({ title, paths }));

const summary = {
  totalFiles: files.length,
  parseErrors,
  missingTitle,
  missingDescription,
  shortTitles,
  longTitles,
  duplicateTitles: duplicateTitleEntries,
};

console.log(JSON.stringify(summary, null, 2));

if (parseErrors.length || missingTitle.length || missingDescription.length) {
  process.exit(1);
}
