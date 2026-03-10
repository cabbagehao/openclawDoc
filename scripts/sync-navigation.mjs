#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function translateLabel(label, mapping) {
  return mapping[label] || label;
}

function createPathPrefixer(langId) {
  return function prefixPath(page) {
    if (typeof page === "string") {
      return page.startsWith(`${langId}/`) ? page : `${langId}/${page}`;
    }
    if (page && typeof page === "object") {
      return {
        ...page,
        group: page.group,
        pages: Array.isArray(page.pages) ? page.pages.map(prefixPath) : [],
      };
    }
    return page;
  };
}

function createNestedTranslator(mapping, langId) {
  const prefixPath = createPathPrefixer(langId);
  return function translateNestedPage(page) {
    if (typeof page === "string") return prefixPath(page);
    if (!page || typeof page !== "object") return page;
    return {
      ...page,
      group: page.group ? translateLabel(page.group, mapping) : page.group,
      pages: Array.isArray(page.pages) ? page.pages.map((item) => translateNestedPage(item)) : [],
    };
  };
}

async function main() {
  const args = process.argv.slice(2);
  let langId = "";
  let langCode = "";
  let docsJsonPath = "docs/docs.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lang") langId = args[++i];
    if (args[i] === "--code") langCode = args[++i];
    if (args[i] === "--docs") docsJsonPath = args[++i];
  }

  if (!langId || !langCode) {
    throw new Error("Missing required arguments: --lang <e.g., ja-JP> --code <e.g., ja>");
  }

  const mappingPath = `docs/.i18n/navigation.${langId}.json`;
  
  let mapping = {};
  try {
      mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"));
  } catch (err) {
      console.warn(`Warning: Could not read mapping file at ${mappingPath}. Using empty mapping.`);
  }

  const config = JSON.parse(await fs.readFile(docsJsonPath, "utf8"));
  const languages = config?.navigation?.languages || [];
  const english = languages.find((language) => language.language === "en");
  
  if (!english) throw new Error("English navigation not found in docs.json");

  const translateNestedPage = createNestedTranslator(mapping, langId);

  const translatedNav = {
    language: langCode,
    tabs: (english.tabs || []).map((tab) => ({
      tab: translateLabel(tab.tab, mapping),
      groups: (tab.groups || []).map((group) => ({
        group: translateLabel(group.group, mapping),
        pages: (group.pages || []).map((page) => translateNestedPage(page)),
      })),
    })),
  };

  config.navigation.languages = languages.filter((language) => language.language !== langCode);
  config.navigation.languages.push(translatedNav);
  
  await fs.writeFile(docsJsonPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(`Successfully synced navigation for ${langId} (${langCode}).`);
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});