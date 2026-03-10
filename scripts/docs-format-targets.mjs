#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

if (fs.existsSync(docsDir)) {
  for (const file of walk(docsDir)) {
    process.stdout.write(`${path.relative(root, file)}\n`);
  }
}

const readmePath = path.join(root, "README.md");
if (fs.existsSync(readmePath)) {
  process.stdout.write("README.md\n");
}
