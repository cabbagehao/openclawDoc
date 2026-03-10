#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DOCS_ROOT = path.resolve("docs");
const LINK_RE = /(!?\[[^\]]*])\(([^)]+)\)/g;

const files = [
  "channels/feishu.md",
  "cli/gateway.md",
  "gateway/troubleshooting.md",
  "help/troubleshooting.md",
  "nodes/troubleshooting.md",
  "reference/session-management-compaction.md",
];

function normalizeImageTarget(target, destRelPath) {
  if (!target.startsWith("../images/") && !target.startsWith("./images/") && !target.startsWith("images/")) {
    return target;
  }
  const imageName = target.replace(/^(\.\.\/|\.\/)?images\//, "");
  const destDir = path.dirname(path.join(DOCS_ROOT, "ja-JP", destRelPath));
  const imageAbs = path.join(DOCS_ROOT, "images", imageName);
  return path.relative(destDir, imageAbs).replace(/\\/g, "/");
}

async function fixFile(relPath) {
  const sourcePath = path.join(DOCS_ROOT, relPath);
  const destPath = path.join(DOCS_ROOT, "ja-JP", relPath);
  const [source, dest] = await Promise.all([
    fs.readFile(sourcePath, "utf8"),
    fs.readFile(destPath, "utf8"),
  ]);

  const sourceLinks = [...source.matchAll(LINK_RE)];
  const destLinks = [...dest.matchAll(LINK_RE)];
  if (sourceLinks.length !== destLinks.length) {
    throw new Error(`${relPath}: source/dest link count mismatch (${sourceLinks.length} vs ${destLinks.length})`);
  }

  let output = "";
  let last = 0;
  for (let i = 0; i < destLinks.length; i += 1) {
    const match = destLinks[i];
    const sourceHref = sourceLinks[i][2];
    const fixedHref = normalizeImageTarget(sourceHref, relPath);
    output += dest.slice(last, match.index);
    output += `${match[1]}(${fixedHref})`;
    last = match.index + match[0].length;
  }
  output += dest.slice(last);
  await fs.writeFile(destPath, output, "utf8");
}

async function main() {
  for (const relPath of files) {
    await fixFile(relPath);
    console.log(`fixed ${relPath}`);
  }
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
