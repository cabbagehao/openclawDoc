#!/usr/bin/env node

import fs from "node:fs/promises";

function translateLabel(label, mapping) {
  return mapping[label] || label;
}

function prefixKoPath(page) {
  if (typeof page === "string") {
    return page.startsWith("ko-KR/") ? page : `ko-KR/${page}`;
  }
  if (page && typeof page === "object") {
    return {
      ...page,
      group: page.group,
      pages: Array.isArray(page.pages) ? page.pages.map(prefixKoPath) : [],
    };
  }
  return page;
}

function translateNestedPage(page, mapping) {
  if (typeof page === "string") return prefixKoPath(page);
  if (!page || typeof page !== "object") return page;
  return {
    ...page,
    group: page.group ? translateLabel(page.group, mapping) : page.group,
    pages: Array.isArray(page.pages) ? page.pages.map((item) => translateNestedPage(item, mapping)) : [],
  };
}

async function main() {
  const [docsJsonPath = "docs/docs.json", mappingPath = "docs/.i18n/navigation.ko-KR.json"] = process.argv.slice(2);
  const config = JSON.parse(await fs.readFile(docsJsonPath, "utf8"));
  const mapping = JSON.parse(await fs.readFile(mappingPath, "utf8"));
  const languages = config?.navigation?.languages || [];
  const english = languages.find((language) => language.language === "en");
  if (!english) throw new Error("English navigation not found");

  const korean = {
    language: "ko",
    tabs: (english.tabs || []).map((tab) => ({
      tab: translateLabel(tab.tab, mapping),
      groups: (tab.groups || []).map((group) => ({
        group: translateLabel(group.group, mapping),
        pages: (group.pages || []).map((page) => translateNestedPage(page, mapping)),
      })),
    })),
  };

  config.navigation.languages = languages.filter((language) => language.language !== "ko");
  config.navigation.languages.push(korean);
  await fs.writeFile(docsJsonPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
