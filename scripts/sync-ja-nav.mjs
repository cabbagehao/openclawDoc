import fs from "node:fs";

const docsJsonPath = new URL("../docs/docs.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(docsJsonPath, "utf8"));

const tabTranslations = {
  "Get started": "はじめに",
  Install: "インストール",
  Channels: "チャンネル",
  Agents: "エージェント",
  Tools: "ツール",
  Models: "モデル",
  Platforms: "プラットフォーム",
  "Gateway & Ops": "Gateway と運用",
  Reference: "リファレンス",
  Help: "ヘルプ",
};

const groupTranslations = {
  Advanced: "高度な設定",
  "Agent coordination": "エージェント連携",
  Automation: "自動化",
  Bootstrapping: "ブートストラップ",
  Browser: "ブラウザ",
  "Built-in tools": "組み込みツール",
  "CLI commands": "CLI コマンド",
  Community: "コミュニティ",
  "Compaction internals": "コンパクション内部",
  "Concept internals": "概念の内部仕様",
  Configuration: "設定",
  "Configuration and operations": "設定と運用",
  Contributing: "コントリビューション",
  "Core concepts": "コア概念",
  "Developer setup": "開発者セットアップ",
  "Docs meta": "ドキュメント情報",
  "Environment and debugging": "環境とデバッグ",
  Experiments: "実験",
  Extensions: "拡張",
  "First steps": "最初のステップ",
  Fundamentals: "基礎",
  Gateway: "Gateway",
  Guides: "ガイド",
  Help: "ヘルプ",
  Home: "ホーム",
  "Hosting and deployment": "ホスティングとデプロイ",
  "Install overview": "インストール概要",
  Maintenance: "メンテナンス",
  "Media and devices": "メディアとデバイス",
  "Messages and delivery": "メッセージと配信",
  "Messaging platforms": "メッセージングプラットフォーム",
  "Model concepts": "モデル概念",
  "Multi-agent": "マルチエージェント",
  "Networking and discovery": "ネットワークと検出",
  "Node runtime": "Node ランタイム",
  "Other install methods": "その他のインストール方法",
  Overview: "概要",
  "Platforms overview": "プラットフォーム概要",
  Project: "プロジェクト",
  "Protocols and APIs": "プロトコルと API",
  Providers: "プロバイダー",
  "RPC and API": "RPC と API",
  "Release notes": "リリースノート",
  "Remote access": "リモートアクセス",
  Security: "セキュリティ",
  "Security and sandboxing": "セキュリティとサンドボックス",
  "Sessions and memory": "セッションとメモリ",
  Skills: "Skills",
  "Technical reference": "技術リファレンス",
  Templates: "テンプレート",
  "Web interfaces": "Web インターフェース",
  "macOS companion app": "macOS コンパニオンアプリ",
};

function translatePage(page) {
  if (typeof page === "string") {
    return page.startsWith("ja-JP/") ? page : `ja-JP/${page}`;
  }

  if (page && typeof page === "object") {
    return translateGroup(page);
  }

  return page;
}

function translateGroup(group) {
  const translated = { ...group };
  if (typeof translated.group === "string") {
    translated.group = groupTranslations[translated.group] ?? translated.group;
  }
  if (Array.isArray(translated.pages)) {
    translated.pages = translated.pages.map(translatePage);
  }
  return translated;
}

const languages = config.navigation?.languages ?? [];
const enLocale = languages.find((entry) => entry.language === "en");
if (!enLocale) {
  throw new Error("English locale not found in docs/docs.json");
}

const jaLocale = {
  language: "ja",
  tabs: enLocale.tabs.map((tab) => ({
    ...tab,
    tab: tabTranslations[tab.tab] ?? tab.tab,
    groups: (tab.groups ?? []).map(translateGroup),
  })),
};

config.navigation.languages = languages.map((entry) =>
  entry.language === "ja" ? jaLocale : entry,
);

fs.writeFileSync(docsJsonPath, `${JSON.stringify(config, null, 2)}\n`);
