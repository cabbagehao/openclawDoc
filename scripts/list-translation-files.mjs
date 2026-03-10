#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.join(__dirname, '..');

// Glossary terms
const glossary = {
  'Dashboard': 'ダッシュボード',
  'pairing': 'ペアリング',
  'Pairing': 'ペアリング',
  'channel': 'チャンネル',
  'Channel': 'チャンネル',
  'channels': 'チャンネル',
  'Channels': 'チャンネル',
  'session': 'セッション',
  'Session': 'セッション',
  'sessions': 'セッション',
  'Sessions': 'セッション',
  'provider': 'プロバイダー',
  'Provider': 'プロバイダー',
  'providers': 'プロバイダー',
  'Providers': 'プロバイダー',
  'model': 'モデル',
  'Model': 'モデル',
  'models': 'モデル',
  'Models': 'モデル',
  'tool': 'ツール',
  'Tool': 'ツール',
  'tools': 'ツール',
  'Tools': 'ツール',
  'agent': 'エージェント',
  'Agent': 'エージェント',
  'agents': 'エージェント',
  'Agents': 'エージェント',
  'node': 'ノード',
  'Node': 'ノード',
  'nodes': 'ノード',
  'Nodes': 'ノード',
  'plugin': 'プラグイン',
  'Plugin': 'プラグイン',
  'plugins': 'プラグイン',
  'Plugins': 'プラグイン',
  'self-hosted': 'セルフホスト型',
  'Self-hosted': 'セルフホスト型',
  'onboarding': 'オンボーディング',
  'Onboarding': 'オンボーディング',
  'wizard': 'ウィザード',
  'Wizard': 'ウィザード',
  'sandbox': 'サンドボックス',
  'Sandbox': 'サンドボックス',
  'sandboxing': 'サンドボックス化',
  'Sandboxing': 'サンドボックス化',
  'troubleshooting': 'トラブルシューティング',
  'Troubleshooting': 'トラブルシューティング',
  'Getting Started': 'はじめに',
  'Getting started': 'はじめに',
  'Quick start': 'クイックスタート',
  'Quick Start': 'クイックスタート'
};

// Files already translated
const completed = new Set([
  'docs/ja-JP/date-time.md',
  'docs/ja-JP/cli/backup.md',
  'docs/ja-JP/cli/agent.md'
]);

// List all files to translate
const cliFiles = fs.readdirSync(path.join(docsRoot, 'docs/cli'))
  .filter(f => f.endsWith('.md'))
  .map(f => ({ src: `docs/cli/${f}`, dest: `docs/ja-JP/cli/${f}` }));

const refFiles = fs.readdirSync(path.join(docsRoot, 'docs/reference'))
  .filter(f => f.endsWith('.md'))
  .map(f => ({ src: `docs/reference/${f}`, dest: `docs/ja-JP/reference/${f}` }));

const allFiles = [...cliFiles, ...refFiles].filter(f => !completed.has(f.dest));

console.log(`Total files to translate: ${allFiles.length}`);
console.log(JSON.stringify(allFiles, null, 2));
